import fs from 'node:fs';
import path from 'node:path';

const API='https://api.sharpapi.io/api/v1/odds';
const OUTRIGHTS='https://www.outrights.io/nfl/mvp-odds';
const KEY=process.env.SHARPAPI_KEY;
const OUT=path.join(process.cwd(),'data','purdy-mvp.json');
const PLAYER='Brock Purdy';
const SHARP_BOOKS=['draftkings','fanduel'];
const OUTRIGHTS_BOOKS=[
  'betonline','bovada','mybookie','pinnacle','betmgm','betrivers',
  'draftkings','fanduel','dkpredict','kalshi','og','polymarket','prophetx'
];
const TICKET={stake:200,oddsAmerican:1900,payout:3800};

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
const validAmerican=n=>Number.isFinite(Number(n))&&(Number(n)>=100||Number(n)<=-100);

async function fetchRows(book,opts={}){
  if(!KEY)return [];
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
  if(!KEY)return null;
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

async function outrightsMarket(){
  const res=await fetch(OUTRIGHTS,{headers:{'Accept':'text/html','User-Agent':'Mozilla/5.0 (compatible; MEFFL-PurdyTracker/1.0)'}});
  if(!res.ok)throw new Error(`Outrights ${res.status}: ${res.statusText}`);
  const text=decodeText(await res.text());
  const tableStart=text.indexOf('Every price, every book');
  const start=text.indexOf(PLAYER,Math.max(0,tableStart));
  if(start<0)throw new Error('Outrights could not locate Brock Purdy row.');
  const next=text.indexOf('Drake Maye',start+PLAYER.length);
  let row=text.slice(start,next>start?next:start+1400);

  // Remove line-movement annotations (for example, "1.0pp") before tokenizing.
  row=row.replace(/\b\d+(?:\.\d+)?pp\b/gi,' ');
  // Outrights row layout is Avg, Best, Open, then one slot for each listed book.
  // Missing book prices are shown with an em dash. En dashes attached to prices are movement markers.
  const tokens=[...row.matchAll(/([+-]\d{3,5}|—)/g)].map(m=>m[1]);
  if(tokens.length<4)throw new Error(`Outrights row shape changed; found only ${tokens.length} market tokens.`);
  const bookTokens=tokens.slice(3,3+OUTRIGHTS_BOOKS.length);
  const prices={};
  for(let i=0;i<OUTRIGHTS_BOOKS.length;i++){
    const token=bookTokens[i];
    if(!token||token==='—')continue;
    const n=Number(token);
    if(validAmerican(n))prices[OUTRIGHTS_BOOKS[i]]={odds_american:n,timestamp:new Date().toISOString(),source:'outrights'};
  }
  if(Object.keys(prices).length<2)throw new Error(`Outrights returned too few usable Purdy prices: ${Object.keys(prices).length}.`);
  return prices;
}

// Start with every currently available Outrights book, then replace the DK/FD
// slots with SharpAPI's prices when available so the same sportsbook is not double-counted.
let marketByBook={};
try{
  marketByBook=await outrightsMarket();
}catch(err){
  console.log(`Outrights market unavailable: ${err.message}`);
}

for(const book of SHARP_BOOKS){
  try{
    const pick=await sharpPrice(book);
    if(pick&&validAmerican(pick.odds_american)){
      marketByBook[book]={...pick,source:'sharpapi'};
    }
  }catch(err){
    console.log(`SharpAPI ${book} unavailable: ${err.message}`);
  }
}

const prices=Object.values(marketByBook)
  .map(x=>Number(x?.odds_american))
  .filter(validAmerican);

if(prices.length<2){
  throw new Error(`Need at least two Purdy MVP prices before publishing. Found ${prices.length}.`);
}

const live=Math.round(prices.reduce((sum,n)=>sum+n,0)/prices.length);
const sourceTimes=Object.values(marketByBook)
  .map(x=>x?.timestamp)
  .filter(Boolean)
  .map(x=>new Date(x))
  .filter(x=>!Number.isNaN(x.getTime()));
const moveAt=(sourceTimes.length?new Date(Math.max(...sourceTimes.map(x=>x.getTime()))):new Date()).toISOString();

let old={};
try{old=JSON.parse(fs.readFileSync(OUT,'utf8'))}catch{}
const oldLive=Number(old?.liveMarket?.american);
const oldCount=Number(old?.liveMarket?.sourceCount);
if(Number.isFinite(oldLive)&&oldLive===live&&oldCount===prices.length){
  console.log(`Live Market unchanged at ${live>=0?'+':''}${live} across ${prices.length} books/markets; no site commit needed.`);
  process.exit(0);
}

const history=Array.isArray(old.history)?old.history.filter(x=>x&&x.at&&Number.isFinite(Number(x.american))):[];
history.push({at:moveAt,american:live,sourceCount:prices.length});
const payload={
  title:'Miscellaneous Expenditures HK Lounge Orgy Fund',
  player:PLAYER,
  market:'NFL MVP',
  bet:TICKET,
  liveMarket:{american:live,sourceCount:prices.length},
  lastMarketMoveAt:moveAt,
  history:history.slice(-1500)
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
console.log(`Published Live Market ${live>=0?'+':''}${live} averaged across ${prices.length} unique books/markets.`);
