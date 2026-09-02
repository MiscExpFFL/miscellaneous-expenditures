// ==UserScript==
// @name         MEFFL Weekly Collector — Tuesday + Thursday
// @namespace    https://www.miscellaneousexpenditures.com/
// @version      1.0.0
// @description  Collect Yahoo Fantasy league data twice a week for Miscellaneous Expenditures without the Yahoo API.
// @match        https://football.fantasysports.yahoo.com/*/f1/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function(){
  'use strict';

  const SCHEMA='meffl-weekly-collector/v1';
  const KNOWN_TEAMS={
    'SVDBaller':'Harry',
    'Wheat Hill Slow Blows':'Tommy',
    'Rise of the Pleasure Machines':'Christopher',
    'SFPAL Junior 49ers':'Tom',
    'Bogota Booger Boys':'Andrew',
    'The Great Communicator':'Matt F.',
    'Premature Ejleculators':'Matty B.',
    'Jelq Me Jeantly':'Owen',
    'The Breeder':'Patrick',
    'MCFISH':'Danny'
  };
  const MANAGER_TEAM=Object.fromEntries(Object.entries(KNOWN_TEAMS).map(([t,m])=>[m,t]));
  const POS=['QB','RB','WR','TE','K','DEF'];
  const SLOT=['QB','RB','WR','TE','W/R/T','W/R','R/W/T','FLEX','K','DEF','BN','BENCH','IR'];
  const clean=v=>String(v??'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
  const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const num=v=>{const n=Number(String(v??'').replace(/[$,% ,]/g,''));return Number.isFinite(n)?n:null};
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const now=()=>new Date().toISOString();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function context(){
    const m=location.pathname.match(/\/(\d{4})\/f1\/(\d+)/);
    return {season:m?Number(m[1]):new Date().getFullYear(),leagueId:m?m[2]:'',base:m?`${location.origin}/${m[1]}/f1/${m[2]}`:''};
  }
  const CTX=context();
  if(!CTX.base||!CTX.leagueId) return;

  const BIND_KEY='MEFFL:weeklyCollector:boundLeague';
  const scope=()=>`${CTX.season}:${CTX.leagueId}`;
  const boundScope=()=>String(GM_getValue(BIND_KEY,'')||'');
  const isBoundHere=()=>boundScope()===scope();
  const bindHere=()=>{GM_setValue(BIND_KEY,scope());location.reload()};
  const unbind=()=>{GM_deleteValue(BIND_KEY);location.reload()};

  const key=(suffix)=>`MEFFL:${CTX.season}:${CTX.leagueId}:${suffix}`;
  const getState=()=>GM_getValue(key('state'),{mode:'post-mnf',targetWeek:1,captures:[],data:{},teamMap:[],updatedAt:null});
  const saveState=s=>{s.updatedAt=now();GM_setValue(key('state'),s);render();};
  let state=getState();

  function textOf(el){return clean(el?.innerText||el?.textContent||'');}
  function pageRows(root=document){
    const out=[];
    root.querySelectorAll('tr,li,article').forEach(el=>{
      const t=textOf(el); if(t&&t.length<1800)out.push(t);
    });
    return uniq(out).slice(0,1600);
  }
  function detectKind(url=location.href,root=document){
    const p=new URL(url,location.href).pathname.toLowerCase();
    const body=textOf(root.body||root).slice(0,12000).toLowerCase();
    if(/\/transactions(?:\/|$)/.test(p)||body.includes('recent transactions'))return 'transactions';
    if(/\/standings(?:\/|$)/.test(p)||body.includes('league standings'))return 'standings';
    if(/\/players(?:\/|$)/.test(p)||body.includes('available players'))return 'players';
    const teamPath=p.match(new RegExp(`/f1/${CTX.leagueId}/(\\d+)(?:/|$)`));
    if(teamPath&&!['standings','transactions','players','draftresults'].includes(teamPath[1]))return 'roster';
    if(body.includes('matchup')||body.includes('matchups')||body.includes('scoreboard'))return 'matchups';
    return 'league';
  }
  function capture(root=document,url=location.href,title=document.title,kind=detectKind(url,root)){
    const raw=clean(textOf(root.body||root));
    return {kind,url,title:clean(title),capturedAt:now(),text:raw.slice(0,180000),rows:pageRows(root)};
  }

  function findKnownTeams(text){
    const n=norm(text);return Object.keys(KNOWN_TEAMS).map(t=>({t,i:n.indexOf(norm(t))})).filter(x=>x.i>=0).sort((a,b)=>a.i-b.i).map(x=>x.t);
  }
  function managerForTeam(team){return KNOWN_TEAMS[team]||'';}

  function discoverTeamMap(root=document,base=CTX.base){
    const found=[];
    root.querySelectorAll('a[href]').forEach(a=>{
      let u;try{u=new URL(a.href,location.href)}catch{return}
      const m=u.pathname.match(new RegExp(`/f1/${CTX.leagueId}/(\\d+)(?:/|$)`));
      if(!m)return;
      const id=Number(m[1]);if(!(id>=1&&id<=30))return;
      const contextText=clean(`${textOf(a)} ${textOf(a.closest('tr,li,article,div')||a)}`);
      const teams=findKnownTeams(contextText);
      for(const team of teams)found.push({yahooTeamId:id,team,manager:managerForTeam(team),url:`${base}/${id}`});
    });
    const by={};for(const x of found)by[x.team]=x;
    return Object.values(by);
  }

  function parseTable(root,matcher){
    const results=[];
    root.querySelectorAll('table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')].map(th=>norm(textOf(th)));
      if(!matcher(headers,table))return;
      [...table.querySelectorAll('tbody tr')].forEach(tr=>{
        const cells=[...tr.children].map(td=>clean(textOf(td)));
        if(cells.length)results.push({headers,cells,text:clean(textOf(tr)),row:tr});
      });
    });
    return results;
  }
  function headerIndex(headers,variants){
    for(const v of variants){const i=headers.findIndex(h=>h===v||h.includes(v));if(i>=0)return i}return -1;
  }

  function parseStandings(root=document){
    const rows=parseTable(root,(h)=>h.some(x=>/team|manager/.test(x))&&h.some(x=>/^w$|wins|record/.test(x)||x.includes('points for')||x==='pf'));
    const out=[];
    for(const r of rows){
      const teams=findKnownTeams(r.text);if(teams.length!==1)continue;const team=teams[0],h=r.headers,c=r.cells;
      const ixRank=headerIndex(h,['rank','#']),ixRecord=headerIndex(h,['record','w-l-t','w-l']),ixW=headerIndex(h,['wins','w']),ixL=headerIndex(h,['losses','l']);
      const ixPF=headerIndex(h,['points for','pts for','pf']),ixPA=headerIndex(h,['points against','pts against','pa']),ixStreak=headerIndex(h,['streak']);
      let w=ixW>=0?num(c[ixW]):null,l=ixL>=0?num(c[ixL]):null,record=ixRecord>=0?c[ixRecord]:'';
      if((w==null||l==null)&&record){const m=record.match(/(\d+)\s*-\s*(\d+)/);if(m){w=+m[1];l=+m[2]}}
      out.push({rank:ixRank>=0?num(c[ixRank]):out.length+1,team,manager:managerForTeam(team),record:record||`${w??0}-${l??0}`,w:w??0,l:l??0,pf:ixPF>=0?num(c[ixPF]):null,pa:ixPA>=0?num(c[ixPA]):null,streak:ixStreak>=0?c[ixStreak]:'',sourceText:r.text});
    }
    if(out.length>=8)return dedupeByTeam(out);
    // Fallback: smallest row-like elements containing exactly one known team + a record.
    const candidates=[...root.querySelectorAll('tr,li,article,div')].map(el=>({el,text:textOf(el)})).filter(x=>x.text.length<900&&findKnownTeams(x.text).length===1&&/\b\d+\s*-\s*\d+\b/.test(x.text));
    const seen=new Set(out.map(x=>x.team));
    for(const x of candidates.sort((a,b)=>a.text.length-b.text.length)){
      const team=findKnownTeams(x.text)[0];if(seen.has(team))continue;
      const rm=x.text.match(/\b(\d+)\s*-\s*(\d+)\b/);if(!rm)continue;
      const vals=[...x.text.matchAll(/\b(\d{1,4}(?:\.\d{1,2})?)\b/g)].map(m=>Number(m[1]));
      out.push({rank:null,team,manager:managerForTeam(team),record:`${rm[1]}-${rm[2]}`,w:+rm[1],l:+rm[2],pf:null,pa:null,streak:'',sourceText:x.text,numericTokens:vals});seen.add(team);
    }
    return dedupeByTeam(out);
  }
  function dedupeByTeam(arr){const m={};for(const x of arr)if(x.team&&!m[x.team])m[x.team]=x;return Object.values(m)}

  function scoreTokens(text){
    return [...text.matchAll(/(?<![\w.])(\d{1,3}(?:\.\d{1,2})?)(?![\w.])/g)].map(m=>({n:+m[1],i:m.index})).filter(x=>x.n>=0&&x.n<250);
  }
  function parseMatchups(root=document,week=state.targetWeek){
    const cand=[];
    root.querySelectorAll('tr,li,article,section,div').forEach(el=>{
      const t=textOf(el);if(!t||t.length>1800)return;const teams=findKnownTeams(t);if(teams.length!==2)return;
      cand.push({text:t,teams,el});
    });
    const best={};
    for(const c of cand.sort((a,b)=>a.text.length-b.text.length)){
      const k=[...c.teams].sort().join('|');if(!best[k])best[k]=c;
    }
    const out=[];
    for(const c of Object.values(best)){
      const [a,b]=c.teams;const tokens=scoreTokens(c.text);
      const status=/\bfinal\b|completed|closed/i.test(c.text)?'FINAL':(/live|quarter|halftime/i.test(c.text)?'LIVE':'SCHEDULED');
      // Prefer explicit score-like nodes if available.
      let nums=[...c.el.querySelectorAll('[class*="score" i],[data-tst*="score" i]')].map(x=>num(textOf(x))).filter(x=>x!=null&&x<250);
      if(nums.length<2)nums=tokens.map(x=>x.n).filter(n=>n>=0&&n<220);
      // Remove obvious week/year/team-record noise; Yahoo fantasy scores usually contain decimals.
      const decimals=nums.filter(n=>!Number.isInteger(n));if(decimals.length>=2)nums=decimals;
      let scoreA=null,scoreB=null,projA=null,projB=null;
      if(nums.length>=2){if(status==='FINAL'||status==='LIVE'){scoreA=nums[0];scoreB=nums[1]}else{projA=nums[0];projB=nums[1]}}
      out.push({week:Number(week)||1,teamA:a,teamB:b,scoreA,scoreB,projA,projB,status,final:status==='FINAL',sourceText:c.text});
    }
    return out.slice(0,8);
  }

  function parsePlayer(text){
    const lines=clean(text).split(/\n+/).map(clean).filter(Boolean);const joined=lines.join(' ');
    let name='',pos='',nfl='';
    let m=joined.match(/^(.+?)\s+([A-Z]{2,4})\s*[-–·|]\s*(QB|RB|WR|TE|K|DEF)\b/i);
    if(m){name=clean(m[1]);nfl=m[2].toUpperCase();pos=m[3].toUpperCase()}
    if(!m){m=joined.match(/^(.+?)\s*\((QB|RB|WR|TE|K|DEF)\s*[-–·|]\s*([A-Z]{2,4})\)/i);if(m){name=clean(m[1]);pos=m[2].toUpperCase();nfl=m[3].toUpperCase()}}
    if(!m){m=joined.match(/^(.+?)\s+(QB|RB|WR|TE|K|DEF)\s*[-–·|]\s*([A-Z]{2,4})\b/i);if(m){name=clean(m[1]);pos=m[2].toUpperCase();nfl=m[3].toUpperCase()}}
    if(!name)return null;
    name=name.replace(/\bPlayer Note\b.*$/i,'').replace(/\bVideo Forecast\b.*$/i,'').trim();
    const slot=lines.map(x=>x.toUpperCase()).find(x=>SLOT.includes(x))||'';
    const status=(joined.match(/\b(IR|PUP|SUSP|OUT|O|Q|D)\b/)||[])[1]||'';
    const pts=[...joined.matchAll(/\b(\d{1,3}(?:\.\d{1,2})?)\b/g)].map(x=>Number(x[1])).filter(x=>x<100);
    return {name,pos,nflTeam:nfl,slot,status,points:pts.length?pts[pts.length-1]:null,projected:null,sourceText:clean(text)};
  }
  function teamFromDocument(root=document,title=''){
    const t=clean(`${title} ${textOf(root.body||root).slice(0,3000)}`);const teams=findKnownTeams(t);return teams[0]||'';
  }
  function parseRoster(root=document,title=document.title,url=location.href){
    const team=teamFromDocument(root,title);if(!team)return null;
    let players=[];
    root.querySelectorAll('tbody tr,li,article').forEach(el=>{const p=parsePlayer(textOf(el));if(p)players.push(p)});
    const by={};for(const p of players)if(!by[`${p.name}|${p.pos}`]||p.sourceText.length<by[`${p.name}|${p.pos}`].sourceText.length)by[`${p.name}|${p.pos}`]=p;
    players=Object.values(by).slice(0,30);
    const m=new URL(url,location.href).pathname.match(new RegExp(`/f1/${CTX.leagueId}/(\\d+)`));
    return {team,manager:managerForTeam(team),yahooTeamId:m?Number(m[1]):null,players,capturedAt:now()};
  }

  function parseTransactions(root=document){
    const out=[];const els=[...root.querySelectorAll('tbody tr,li,article')];
    for(const el of els){
      const t=textOf(el);if(!t||t.length>1400||!/add|drop|waiver|trade|claim|acquir|release|free agent/i.test(t))continue;
      const teams=findKnownTeams(t);const team=teams[0]||'';const manager=team?managerForTeam(team):Object.keys(MANAGER_TEAM).find(m=>norm(t).includes(norm(m)))||'';
      const faab=(t.match(/\$(\d{1,3})/)||[])[1];
      let type=/trade/i.test(t)?'TRADE':(/waiver|claim/i.test(t)?'WAIVER':(/drop|release/i.test(t)&&/add|acquir/i.test(t)?'ADD/DROP':(/drop|release/i.test(t)?'DROP':'ADD')));
      let add='',drop='';
      const am=t.match(/(?:added|acquired|claimed)\s+([^\n·|]+?)(?=\s+(?:dropped|released)|$)/i);if(am)add=clean(am[1]);
      const dm=t.match(/(?:dropped|released)\s+([^\n·|]+?)(?=\s+(?:added|acquired|claimed)|$)/i);if(dm)drop=clean(dm[1]);
      out.push({type,team:team||MANAGER_TEAM[manager]||'',manager:manager||managerForTeam(team),add,drop,faab:faab?+faab:null,description:t,time:'',sourceText:t});
    }
    const seen=new Set();return out.filter(x=>{const k=norm(`${x.type}|${x.team}|${x.description}`);if(seen.has(k))return false;seen.add(k);return true}).slice(0,120);
  }

  function parseAvailable(root=document){
    const players=[];
    root.querySelectorAll('tbody tr,li,article').forEach(el=>{const p=parsePlayer(textOf(el));if(p)players.push({...p,status:p.status||'FA',recent:p.points})});
    const seen=new Set();return players.filter(p=>{const k=norm(p.name);if(seen.has(k))return false;seen.add(k);return true}).slice(0,80);
  }

  function parseFaab(root=document){
    const out=[];
    root.querySelectorAll('tr,li,article').forEach(el=>{
      const t=textOf(el);if(!t||t.length>800)return;const teams=findKnownTeams(t);if(teams.length!==1)return;
      const dollars=[...t.matchAll(/\$(\d{1,3})/g)].map(m=>+m[1]);if(!dollars.length)return;
      const team=teams[0],remaining=dollars[dollars.length-1];
      const pr=(t.match(/(?:waiver\s+priority|priority)\s*#?\s*(\d{1,2})/i)||[])[1];
      out.push({team,manager:managerForTeam(team),priority:pr?+pr:null,spent:Math.max(0,100-remaining),remaining,claimsWon:0,sourceText:t});
    });
    return dedupeByTeam(out);
  }

  function mergeData(base,patch){
    const o={...base};
    for(const [k,v] of Object.entries(patch||{})){
      if(Array.isArray(v)&&v.length){
        if(k==='rosters'){const by=Object.fromEntries((o.rosters||[]).map(x=>[x.team,x]));for(const x of v)if(x?.team)by[x.team]=x;o.rosters=Object.values(by)}
        else if(k==='matchups'||k==='matchupProjections'){
          const key=x=>`${Number(x?.week)||0}|${[x?.teamA||'',x?.teamB||''].sort().join('|')}`;
          const by=Object.fromEntries((o[k]||[]).map(x=>[key(x),x]));for(const x of v)if(x?.teamA&&x?.teamB)by[key(x)]=x;o[k]=Object.values(by);
        }
        else if(['standings','transactions','availablePlayers','faab'].includes(k))o[k]=v;
        else o[k]=v;
      }else if(v!=null&&!Array.isArray(v))o[k]=v;
    }
    return o;
  }

  function parseRoot(root,url,title,kind){
    const patch={};
    let wk=state.targetWeek||1;
    try{wk=Number(new URL(url,location.href).searchParams.get('week'))||wk}catch{}
    if(kind==='standings'||kind==='league')patch.standings=parseStandings(root);
    if(kind==='matchups'||kind==='league'){
      const ms=parseMatchups(root,wk);patch.matchups=ms;patch.matchupProjections=ms.filter(x=>x.projA!=null&&x.projB!=null);
    }
    if(kind==='roster'){const r=parseRoster(root,title,url);patch.rosters=r?[r]:[]}
    if(kind==='transactions'||kind==='league'){patch.transactions=parseTransactions(root);patch.faab=parseFaab(root)}
    if(kind==='players')patch.availablePlayers=parseAvailable(root);
    const tm=discoverTeamMap(root);if(tm.length)state.teamMap=mergeTeamMap(state.teamMap,tm);
    return patch;
  }
  function mergeTeamMap(a=[],b=[]){const by={};for(const x of [...a,...b])if(x.team)by[x.team]=x;return Object.values(by)}

  async function captureCurrent(){
    const kind=detectKind();const c=capture(document,location.href,document.title,kind);
    state.captures=[...(state.captures||[]).filter(x=>x.url!==c.url),c].slice(-40);
    state.data=mergeData(state.data,parseRoot(document,location.href,document.title,kind));
    saveState(state);toast(`Captured ${kind}`);
  }

  async function fetchDoc(url){
    const r=await fetch(url,{credentials:'include',cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const html=await r.text();const doc=new DOMParser().parseFromString(html,'text/html');return {doc,url,title:doc.title||url};
  }
  async function collectUrl(url,forcedKind=null){
    const {doc,title}=await fetchDoc(url);const kind=forcedKind||detectKind(url,doc);const c=capture(doc,url,title,kind);
    state.captures=[...(state.captures||[]).filter(x=>x.url!==url),c].slice(-40);
    state.data=mergeData(state.data,parseRoot(doc,url,title,kind));
    saveState(state);return kind;
  }
  async function autoCollect(){
    setBusy(true,'COLLECTING…');
    const target=Number(state.targetWeek)||1,completed=Math.max(0,target-1);
    const urls=[
      [CTX.base,'league'],
      ...(state.mode==='post-mnf'&&completed>=1?[[`${CTX.base}?week=${completed}`,'matchups']]:[]),
      [`${CTX.base}?week=${target}`,'matchups'],
      [`${CTX.base}/standings`,'standings'],
      [`${CTX.base}/transactions`,'transactions'],
      [`${CTX.base}/players`,'players']
    ];
    let ok=0,fail=0;
    for(const [u,k] of urls){try{await collectUrl(u,k);ok++}catch(e){console.warn('MEFFL collector',u,e);fail++}await sleep(250)}
    // Base/standings pages usually expose all team links. Fetch each discovered roster.
    const map=state.teamMap||[];
    for(const x of map){try{await collectUrl(x.url||`${CTX.base}/${x.yahooTeamId}`,'roster');ok++}catch(e){console.warn('MEFFL roster',x,e);fail++}await sleep(180)}
    setBusy(false);toast(`Auto collect: ${ok} pages${fail?`, ${fail} failed`:''}`);render();
  }

  function rosterDelta(prev=[],cur=[]){
    const p=Object.fromEntries(prev.map(r=>[r.team,new Set((r.players||[]).map(x=>norm(x.name)))]));
    const pNames=Object.fromEntries(prev.map(r=>[r.team,Object.fromEntries((r.players||[]).map(x=>[norm(x.name),x.name]))]));
    const out=[];
    for(const r of cur){const old=p[r.team]||new Set(),nowSet=new Set((r.players||[]).map(x=>norm(x.name))),nowNames=Object.fromEntries((r.players||[]).map(x=>[norm(x.name),x.name]));
      const added=[...nowSet].filter(x=>!old.has(x)).map(x=>nowNames[x]);const removed=[...old].filter(x=>!nowSet.has(x)).map(x=>pNames[r.team]?.[x]||x);
      if(added.length||removed.length)out.push({team:r.team,manager:r.manager,added,removed});
    }return out;
  }
  function faabDelta(prev=[],cur=[]){
    const p=Object.fromEntries(prev.map(x=>[x.team,x]));return cur.map(x=>{const old=p[x.team];if(!old)return null;const d=(num(old.remaining)??100)-(num(x.remaining)??100);return d?{team:x.team,manager:x.manager,spentSinceTuesday:d,remaining:x.remaining}:null}).filter(Boolean)
  }
  function makeDelta(){
    if(state.mode!=='post-waivers')return null;
    const prev=GM_getValue(key(`snapshot:${state.targetWeek}:post-mnf`),null);if(!prev)return {baselineFound:false,rosterChanges:[],faabChanges:[],newTransactions:[]};
    const prevTx=new Set((prev.data?.transactions||[]).map(x=>norm(x.description)));
    return {baselineFound:true,baselineCapturedAt:prev.capturedAt,
      rosterChanges:rosterDelta(prev.data?.rosters||[],state.data?.rosters||[]),
      faabChanges:faabDelta(prev.data?.faab||[],state.data?.faab||[]),
      newTransactions:(state.data?.transactions||[]).filter(x=>!prevTx.has(norm(x.description)))
    };
  }

  function validation(){
    const d=state.data||{},target=Number(state.targetWeek)||1,completed=Math.max(0,target-1);
    const finals=(d.matchups||[]).filter(x=>x.final||/final/i.test(String(x.status||''))||((x.scoreA!=null&&x.scoreB!=null)&&Number(x.week)<=completed));
    const upcoming=(d.matchupProjections||[]).filter(x=>Number(x.week||target)===target);
    const rosters=d.rosters||[],tx=d.transactions||[],st=d.standings||[],avail=d.availablePlayers||[],faab=d.faab||[];
    const checks=state.mode==='post-mnf'?[ 
      ['Standings',st.length>=10,`${st.length}/10 teams`],
      ['Completed matchups',completed===0||finals.length>=5,completed===0?'Preseason':`${finals.length}/5 games`],
      ['Rosters',rosters.length>=10,`${rosters.length}/10 teams`],
      ['Available players',avail.length>=10,`${avail.length} found`]
    ]:[
      ['Transactions',tx.length>0,`${tx.length} found`],
      ['Rosters',rosters.length>=10,`${rosters.length}/10 teams`],
      ['Upcoming matchups',upcoming.length>=5||((d.matchups||[]).length>=5),`${Math.max(upcoming.length,(d.matchups||[]).length)}/5 games`],
      ['FAAB',faab.length>=8,`${faab.length}/10 teams`],
      ['Available players',avail.length>=10,`${avail.length} found`]
    ];
    return {ok:checks.every(x=>x[1]),checks:Object.fromEntries(checks.map(([name,ok,detail])=>[name,{ok,detail}])),counts:{standings:st.length,finals:finals.length,rosters:rosters.length,transactions:tx.length,upcoming:upcoming.length,faab:faab.length,available:avail.length,captures:(state.captures||[]).length}};
  }
  function buildExport(){
    const v=validation(),target=Number(state.targetWeek)||1,completed=Math.max(0,target-1);
    return {schema:SCHEMA,collectorVersion:'1.0.0',league:{season:CTX.season,leagueId:CTX.leagueId,name:'Miscellaneous Expenditures'},mode:state.mode,targetWeek:target,completedWeek:completed,capturedAt:now(),validation:v,teamMap:state.teamMap||[],data:state.data||{},delta:makeDelta(),captures:state.captures||[]};
  }
  function downloadJson(){
    const obj=buildExport();GM_setValue(key(`snapshot:${obj.targetWeek}:${obj.mode}`),obj);
    const mode=obj.mode==='post-mnf'?'POST_MNF':'POST_WAIVERS';const name=`MEFFL_${obj.league.season}_W${String(obj.targetWeek).padStart(2,'0')}_${mode}.json`;
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast(`Exported ${name}`);
  }
  function resetCycle(){
    if(!confirm('Clear the current collector workspace? Saved Tuesday/Thursday snapshots stay available for comparison.'))return;
    state={mode:state.mode,targetWeek:state.targetWeek,captures:[],data:{},teamMap:state.teamMap||[],updatedAt:null};saveState(state);toast('Workspace cleared');
  }
  function setMode(mode){
    if(state.mode===mode)return;state.mode=mode;state.captures=[];state.data={};state.updatedAt=null;saveState(state);
  }
  function setWeek(v){const n=Math.max(1,Math.min(17,Number(v)||1));state.targetWeek=n;saveState(state)}

  let panel,busy=false;
  GM_addStyle(`
    #meffl-collector{position:fixed;right:18px;bottom:18px;width:370px;max-height:calc(100vh - 36px);overflow:auto;z-index:2147483647;background:#170b0b;color:#f8f0df;border:2px solid #a51c30;border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.42);font:13px/1.35 Arial,sans-serif}
    #meffl-collector *{box-sizing:border-box}#meffl-collector header{padding:14px 15px 10px;border-bottom:1px solid rgba(255,255,255,.14)}
    #meffl-collector h3{margin:0;font-size:16px;color:#fff}#meffl-collector small{color:#c9baa5}
    .meffl-body{padding:12px 14px 14px}.meffl-modes{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
    #meffl-collector button{border:1px solid #72534d;background:#2b1717;color:#fff;border-radius:9px;padding:9px 10px;font-weight:700;cursor:pointer}
    #meffl-collector button.on{background:#a51c30;border-color:#d64055}#meffl-collector button.primary{background:#d1aa45;color:#211507;border-color:#d1aa45;width:100%;margin-top:8px}
    #meffl-collector button.secondary{width:100%;margin-top:7px}#meffl-collector button:disabled{opacity:.55;cursor:wait}
    .meffl-week{display:flex;align-items:center;gap:8px;margin:8px 0 12px}.meffl-week label{font-weight:700}.meffl-week input{width:62px;background:#fff8eb;color:#211507;border:0;border-radius:7px;padding:7px;font-weight:800}
    .meffl-check{display:grid;grid-template-columns:18px 1fr auto;gap:7px;padding:6px 0;border-top:1px solid rgba(255,255,255,.08)}.meffl-check:first-child{border-top:0}.meffl-ok{color:#8fe388}.meffl-no{color:#ff8d95}.meffl-detail{color:#c9baa5;font-size:11px}
    .meffl-note{background:#251616;border:1px solid #51302c;border-radius:10px;padding:9px;margin:9px 0;color:#e6dac6}.meffl-actions{margin-top:8px}.meffl-mini{display:flex;justify-content:space-between;color:#bcae9d;margin-top:9px;font-size:11px}
    #meffl-toast{position:fixed;right:20px;bottom:430px;z-index:2147483647;background:#fff6e6;color:#231515;border:1px solid #a51c30;border-radius:9px;padding:10px 12px;box-shadow:0 8px 25px rgba(0,0,0,.25);font:12px Arial,sans-serif}
    @media(max-width:520px){#meffl-collector{left:8px;right:8px;bottom:8px;width:auto;max-height:70vh}}
  `);
  function setBusy(v,label=''){busy=v;render(label)}
  function toast(msg){const old=document.getElementById('meffl-toast');if(old)old.remove();const d=document.createElement('div');d.id='meffl-toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),3000)}
  function render(busyLabel=''){
    if(!panel){panel=document.createElement('div');panel.id='meffl-collector';document.body.appendChild(panel)}
    if(!isBoundHere()){
      const bound=boundScope();
      panel.innerHTML=`<header><h3>MEFFL WEEKLY COLLECTOR</h3><small>${CTX.season} · detected league ${esc(CTX.leagueId)}</small></header><div class="meffl-body"><div class="meffl-note">This collector must be bound once to the Miscellaneous Expenditures Yahoo league so it cannot accidentally collect another fantasy league.${bound?`<br><br>Currently bound to <b>${esc(bound)}</b>.`:''}</div><button id="meffl-bind" class="primary">USE COLLECTOR ON THIS LEAGUE</button></div>`;
      panel.querySelector('#meffl-bind').onclick=bindHere;
      return;
    }
    const v=validation(),checks=Object.entries(v.checks||{}).map(([n,x])=>`<div class="meffl-check"><span class="${x.ok?'meffl-ok':'meffl-no'}">${x.ok?'✓':'○'}</span><b>${esc(n)}</b><span class="meffl-detail">${esc(x.detail)}</span></div>`).join('');
    const note=state.mode==='post-mnf'?'Run after MNF is final. This snapshot drives the recap, standings/rankings, team needs and waiver preview.':'Run Thursday morning after waivers clear. It compares against Tuesday and drives transaction fallout plus the weekend matchup previews.';
    panel.innerHTML=`<header><h3>MEFFL WEEKLY COLLECTOR</h3><small>${CTX.season} · league ${esc(CTX.leagueId)}</small></header><div class="meffl-body"><div class="meffl-modes"><button data-mode="post-mnf" class="${state.mode==='post-mnf'?'on':''}" ${busy?'disabled':''}>POST-MNF</button><button data-mode="post-waivers" class="${state.mode==='post-waivers'?'on':''}" ${busy?'disabled':''}>POST-WAIVERS</button></div><div class="meffl-week"><label>Upcoming week</label><input id="meffl-week" type="number" min="1" max="17" value="${state.targetWeek||1}" ${busy?'disabled':''}><span class="meffl-detail">${state.mode==='post-mnf'?`recaps W${Math.max(0,(state.targetWeek||1)-1)}`:'preview target'}</span></div><div class="meffl-note">${esc(note)}</div><div>${checks}</div><div class="meffl-actions"><button id="meffl-auto" class="primary" ${busy?'disabled':''}>${busy?esc(busyLabel||'WORKING…'):'AUTO COLLECT LEAGUE'}</button><button id="meffl-current" class="secondary" ${busy?'disabled':''}>CAPTURE THIS PAGE</button><button id="meffl-export" class="secondary" ${busy?'disabled':''}>EXPORT JSON${v.ok?' ✓':''}</button><button id="meffl-reset" class="secondary" ${busy?'disabled':''}>CLEAR WORKSPACE</button><button id="meffl-unbind" class="secondary" ${busy?'disabled':''}>UNBIND LEAGUE</button></div><div class="meffl-mini"><span>${v.counts.captures} page captures</span><span>${state.updatedAt?new Date(state.updatedAt).toLocaleTimeString():'not started'}</span></div></div>`;
    panel.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
    panel.querySelector('#meffl-week').onchange=e=>setWeek(e.target.value);
    panel.querySelector('#meffl-auto').onclick=autoCollect;panel.querySelector('#meffl-current').onclick=captureCurrent;panel.querySelector('#meffl-export').onclick=downloadJson;panel.querySelector('#meffl-reset').onclick=resetCycle;panel.querySelector('#meffl-unbind').onclick=unbind;
  }

  // Always absorb the page the user is already looking at once per URL per workspace.
  setTimeout(()=>{
    render();
    if(!isBoundHere())return;
    const seen=(state.captures||[]).some(x=>x.url===location.href);
    if(!seen)captureCurrent().catch(()=>{});
  },900);
})();
