import fs from 'node:fs';
import path from 'node:path';

const API='https://api.sharpapi.io/api/v1/odds';
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

async function fetchRows(book,extra={}){
  const rows=[];
  let offset=0;
  for(let page=0;page<4;page++){
    const u=new URL(API);
    const params={league:'NFL',sportsbook:book,is_live:'false',selection:PLAYER,limit:'200',offset:String(offset),...extra};
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

function pickMvpRow(rows,book){
  const candidates=rows.filter(r=>activePrice(r)&&hasPurdy(r)&&mvpContext(r));
  candidates.sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  if(candidates[0])return candidates[0];

  // Some futures feeds use a generic futures market label while putting the award in event/team text.
  const futureish=rows.filter(r=>activePrice(r)&&hasPurdy(r)&&/future|award/i.test([
    r?.market_type,r?.market_name,r?.event_name,r?.home_team,r?.away_team,r?.category
  ].map(v=>String(v??'')).join(' ')));
  futureish.sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  if(futureish.length===1)return futureish[0];

  const preview=rows.filter(hasPurdy).slice(0,8).map(r=>({
    sportsbook:r?.sportsbook||book,
    event_name:r?.event_name,
    market_type:r?.market_type,
    market_name:r?.market_name,
    selection:r?.selection,
    selection_type:r?.selection_type,
    odds_american:r?.odds_american
  }));
  console.log(`No unambiguous Purdy MVP row found for ${book}. Purdy rows returned:`,JSON.stringify(preview));
  return null;
}

const byBook={};
for(const book of BOOKS){
  let rows=await fetchRows(book);
  let pick=pickMvpRow(rows,book);

  if(!pick){
    // Fallback: ask specifically for futures while preserving the flat row schema.
    rows=await fetchRows(book,{market_type:'future'});
    pick=pickMvpRow(rows,book);
  }
  if(pick)byBook[book]=pick;
}

if(!byBook.draftkings||!byBook.fanduel){
  throw new Error(`Need both free-tier Purdy MVP prices before publishing. Found: ${Object.keys(byBook).join(', ')||'none'}.`);
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
console.log(`Published Live Market ${live>=0?'+':''}${live} from the two free-tier prices.`);
