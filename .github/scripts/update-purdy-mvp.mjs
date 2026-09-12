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
const isMvpName=s=>/\bmvp\b|most valuable player/i.test(String(s||''));
const isPurdy=o=>norm(o?.selection)===norm(PLAYER)||norm(o?.player_name)===norm(PLAYER);

async function fetchGrouped(extra={}){
  const events=[];
  let offset=0;
  for(let page=0;page<4;page++){
    const u=new URL(API);
    const params={league:'nfl',sportsbook:BOOKS.join(','),market:'future',is_live:'false',group_by:'event',limit:'200',offset:String(offset),...extra};
    Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
    const res=await fetch(u,{headers:{'X-API-Key':KEY,'Accept':'application/json'}});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(`SharpAPI ${res.status}: ${body?.error?.message||res.statusText}`);
    if(Array.isArray(body.data))events.push(...body.data);
    if(!body?.pagination?.has_more)break;
    const next=Number(body.pagination.next_offset);
    if(!Number.isFinite(next)||next<=offset)break;
    offset=next;
  }
  return events;
}

function bestMvpEvent(events){
  const candidates=events.map(ev=>{
    const odds=(ev.odds||[]).filter(o=>o?.market_type==='future'&&isPurdy(o)&&o?.is_active!==false&&Number.isFinite(Number(o?.odds_american)));
    const books=new Set(odds.map(o=>o.sportsbook).filter(x=>BOOKS.includes(x)));
    return {ev,odds,score:(isMvpName(ev.event_name)?100:0)+books.size*10};
  }).filter(x=>x.odds.length&&isMvpName(x.ev.event_name));
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0]||null;
}

function latestByBook(rows){
  const out={};
  for(const book of BOOKS){
    const matches=rows.filter(o=>o.sportsbook===book&&o.is_active!==false&&Number.isFinite(Number(o.odds_american)));
    matches.sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
    if(matches[0])out[book]=matches[0];
  }
  return out;
}

let events=await fetchGrouped({selection:PLAYER});
let picked=bestMvpEvent(events);
if(!picked){
  console.log('Exact-selection query did not identify the NFL MVP event; trying the full NFL futures board.');
  events=await fetchGrouped();
  picked=bestMvpEvent(events);
}
if(!picked)throw new Error('Could not find a Brock Purdy NFL MVP future in the current SharpAPI response.');

const byBook=latestByBook(picked.odds);
if(!byBook.draftkings||!byBook.fanduel){
  throw new Error(`Need both free-tier prices before publishing. Found: ${Object.keys(byBook).join(', ')||'none'}.`);
}

const a=Number(byBook.draftkings.odds_american);
const b=Number(byBook.fanduel.odds_american);
const live=Math.round((a+b)/2);
const sourceTimes=[byBook.draftkings.timestamp,byBook.fanduel.timestamp].filter(Boolean).map(x=>new Date(x)).filter(x=>!Number.isNaN(x.getTime()));
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
const trimmed=history.slice(-1500);
const payload={
  title:'Miscellaneous Expenditures HK Lounge Orgy Fund',
  player:PLAYER,
  market:'NFL MVP',
  bet:TICKET,
  liveMarket:{american:live},
  lastMarketMoveAt:moveAt,
  history:trimmed
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
console.log(`Published Live Market ${live>=0?'+':''}${live} from two free-tier prices.`);
