import fs from 'node:fs';
import path from 'node:path';

const API='https://api.sharpapi.io/api/v1/odds';
const OUTRIGHTS='https://www.outrights.io/nfl/mvp-odds';
const KEY=process.env.SHARPAPI_KEY;
const OUT=path.join(process.cwd(),'data','purdy-mvp.json');
const PLAYER='Brock Purdy';
const BOOKS=['draftkings','fanduel'];
const TICKET={stake:200,oddsAmerican:1900,payout:3800};

if(!KEY){
  console.log('SHARPAPI_KEY is not configured; leaving tracker data unchanged.');
  process.exit(0);
}

const norm=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const playerNorm=norm(PLAYER);
const hasPurdy=row=>{
  const fields=[row?.selection,row?.player,row?.player_name,row?.participant,row?.name].map(norm);
  return fields.some(v=>v===playerNorm||v.includes(playerNorm));
};
const mvpContext=row=>{
  const fields=[row?.event_name,row?.market_name,row?.market_type,row?.selection_type,row?.prop,row?.home_team,row?.away_team,row?.description,row?.category]
    .map(v=>String(v??''))
    .join(' ');
  return /\bmvp\b|most valuable player/i.test(fields);
};
const activePrice=row=>row?.is_active!==false&&Number.isFinite(Number(row?.odds_american));

async function fetchRows(book,opts={}){
  const rows=[];
  let offset=0;
  for(let page=0;page<3;page++){
    const u=new URL(API);
    const params={league:'NFL',sportsbook:book,is_live:'false',limit:'200',offset:String(offset)};
    if(opts.selection!==null)params.selection=opts.selection||PLAYER;
    if(opts.market)params.market=opts.market;
    if(opts.market_type)params.market_type=opts.market_type;
    Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
    const res=await fetch(u,{headers:{'X-API-Key':KEY,'Accept':'application/json'}});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(`SharpAPI ${res.status}: ${body?.error?.message||body?.message||res.statusText}`);
    if(Array.isArray(body.data))rows.push(...body.data);
    if(!body?.pagination?.has_more)break;
    const next=Number(body.pagination.next_offset);
    if(!Number.isFinite(next)||next<=offset)break;
    offset=next;
  }
  return rows;
}

function pickMvpRow(rows){
  const candidates=rows.filter(r=>activePrice(r)&&hasPurdy(r)&&mvpContext(r));
  candidates.sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  if(candidates[0])return candidates[0];

  const futureish=rows.filter(r=>activePrice(r)&&hasPurdy(r)&&/future|award/i.test([
    r?.market_type,r?.market_name,r?.event_name,r?.home_team,r?.away_team,r?.category
  ].map(v=>String(v??'')).join(' ')));
  futureish.sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  if(futureish.length===1)return futureish[0];
  return null;
}

async function sharpPrice(book){
  const attempts=[
    {selection:PLAYER},
    {selection:null,market:'future'},
    {selection:null,market_type:'future'}
  ];
  for(const opts of attempts){
    const rows=await fetchRows(book,opts);
    const pick=pickMvpRow(rows);
    if(pick)return pick;
  }
  return null;
}

function decodeText(html){
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&quot;/gi,'"')
    .replace(/\s+/g,' ')
    .trim();
}

async function outrightsPair(){
  const res=await fetch(OUTRIGHTS,{headers:{'Accept':'text/html','User-Agent':'Mozilla/5.0 (compatible; MEFFL-PurdyTracker/1.0)'}});
  if(!res.ok)throw new Error(`Outrights ${res.status}: ${res.statusText}`);
  const text=decodeText(await res.text());
  const tableStart=text.indexOf('Every price, every book');
  const start=text.indexOf(PLAYER,Math.max(0,tableStart));
  if(start<0)throw new Error('Outrights fallback could not locate Brock Purdy row.');
  const next=text.indexOf('Drake Maye',start+PLAYER.length);
  const row=text.slice(start,next>start?next:start+1200);
  const odds=[...row.matchAll(/[+-]\d{3,5}/g)].map(m=>Number(m[0]));
  // Row layout: Avg, Best, Open, then books in page header order.
  // Current header positions put DraftKings and FanDuel at odds indexes 9 and 10.
  if(odds.length<11)throw new Error(`Outrights fallback row shape changed; found ${odds.length} prices.`);
  const draftkings=odds[9],fanduel=odds[10];
  const valid=n=>Number.isFinite(n)&&(n>=100||n<=-100);
  if(!valid(draftkings)||!valid(fanduel))throw new Error('Outrights fallback returned invalid book prices.');
  return {
    draftkings:{odds_american:draftkings,timestamp:new Date().toISOString()},
    fanduel:{odds_american:fanduel,timestamp:new Date().toISOString()}
  };
}

const byBook={};
for(const book of BOOKS){
  const pick=await sharpPrice(book);
  if(pick)byBook[book]=pick;
}

if(!byBook.draftkings||!byBook.fanduel){
  console.log(`SharpAPI did not return both Purdy MVP prices. Found: ${Object.keys(byBook).join(', ')||'none'}. Trying Outrights fallback.`);
  const fallback=await outrightsPair();
  if(!byBook.draftkings)byBook.draftkings=fallback.draftkings;
  if(!byBook.fanduel)byBook.fanduel=fallback.fanduel;
}

if(!byBook.draftkings||!byBook.fanduel){
  throw new Error(`Need both Purdy MVP prices before publishing. Found: ${Object.keys(byBook).join(', ')||'none'}.`);
}

const a=Number(byBook.draftkings.odds_american);
const b=Number(byBook.fanduel.odds_american);
const live=Math.round((a+b)/2);
const sourceTimes=[byBook.draftkings.timestamp,byBook.fanduel.timestamp]
  .filter(Boolean).map(x=>new Date(x)).filter(x=>!Number.isNaN(x.getTime()));
const moveAt=(sourceTimes.length?new Date(Math.max(...sourceTimes.map(x=>x.getTime()))):new Date()).toISOString();

let old={};
try{old=JSON.parse(fs.readFileSync(OUT,'utf8'))}catch{}
const oldLive=Number(old?.liveMarket?.american);
if(Number.isFinite(oldLive)&&oldLive===live){
  console.log(`Live Market unchanged at ${live>=0?'+':''}${live}; no site commit needed.`);
  process.exit(0);
}

const history=Array.isArray(old.history)?old.history.filter(x=>x&&x.at&&Number.isFinite(Number(x.american))):[];
history.push({at:moveAt,american:live});
const payload={
  title:'Miscellaneous Expenditures HK Lounge Orgy Fund',
  player:PLAYER,
  market:'NFL MVP',
  bet:TICKET,
  liveMarket:{american:live},
  lastMarketMoveAt:moveAt,
  history:history.slice(-1500)
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
console.log(`Published Live Market ${live>=0?'+':''}${live}.`);
