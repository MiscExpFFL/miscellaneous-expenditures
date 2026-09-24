(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pair=(a,b)=>[String(a||''),String(b||'')].sort().join('|');
const Y=()=>window.SEASON_2026||{};
const week=()=>Math.max(1,Number(Y().week)||1);
const done=()=>Number(Y().collectorStatus?.completedWeek)||Math.max(0,week()-1);
const page=()=>document.body?.dataset?.page||'';
const card=(t,b,k='')=>'<div class="card">'+(k?'<p class="eyebrow dark">'+esc(k)+'</p>':'')+'<h3>'+esc(t)+'</h3><p>'+b+'</p></div>';
function currentGames(E,w=done()){return (E.realResults?E.realResults():[]).filter(g=>Number(g.week)===Number(w)&&(g.stage||'Regular Season')==='Regular Season')}
function h2h(E){
  if(page()!=='h2h')return;
  document.querySelectorAll('section').forEach(s=>{if(/Five new H2H receipts/i.test(s.querySelector('h2')?.textContent||''))s.remove()});
  const games=currentGames(E),hero=document.querySelector('.page-hero');if(!hero||!games.length||document.getElementById('latest-h2h-receipts'))return;
  const rows=games.map(g=>{const a=g.teamA||g.home,b=g.teamB||g.away,ma=g.managerA||E.managerByTeam?.(a)||a,mb=g.managerB||E.managerByTeam?.(b)||b,sa=Number(g.scoreA),sb=Number(g.scoreB),win=sa>=sb?a:b,lose=sa>=sb?b:a,s=E.series?.(ma,mb);return '<tr><td><b>'+esc(win)+'</b> '+Math.max(sa,sb).toFixed(2)+'–'+Math.min(sa,sb).toFixed(2)+' '+esc(lose)+'</td><td>'+(s?esc(ma)+' '+s.w+'-'+s.l+' '+esc(mb):'Updated')+'</td></tr>'}).join('');
  hero.insertAdjacentHTML('afterend','<section class="section" id="latest-h2h-receipts"><div class="shell"><div class="section-head"><div><p class="eyebrow dark">WEEK '+done()+' ADDED</p><h2>Five new H2H receipts</h2></div></div><div class="table-wrap"><table><thead><tr><th>Result</th><th>Updated series</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></section>');
  const total=(E.allGames?E.allGames():[]).filter(g=>Number.isFinite(Number(g.scoreA))&&Number.isFinite(Number(g.scoreB))).length;
  document.querySelectorAll('section').forEach(s=>{if(s.querySelector('h2')?.textContent.trim()==='Every receipt'){const eb=s.querySelector('.eyebrow');if(eb)eb.textContent=total+'-GAME ARCHIVE'}});
}
function streaks(games){
  const managers=[...new Set(games.flatMap(g=>[g.managerA,g.managerB]).filter(Boolean))],out={};
  for(const m of managers){const gs=games.filter(g=>g.managerA===m||g.managerB===m).sort((a,b)=>(Number(a.year)-Number(b.year))||((Number(a.week)||99)-(Number(b.week)||99)));let cw=0,cl=0,mw=0,ml=0;for(const g of gs){const w=g.winner||(Number(g.scoreA)>Number(g.scoreB)?g.managerA:g.managerB);if(w===m){cw++;cl=0;mw=Math.max(mw,cw)}else{cl++;cw=0;ml=Math.max(ml,cl)}}out[m]={mw,ml}}return out;
}
function records(E){
  if(page()!=='records')return;
  document.querySelectorAll('section').forEach(s=>{if(/Week 1 checked against the vault/i.test(s.querySelector('h2')?.textContent||''))s.remove()});
  const all=(E.allGames?E.allGames():[]).filter(g=>String(g.stage||'Regular Season')==='Regular Season'&&Number.isFinite(Number(g.scoreA))&&Number.isFinite(Number(g.scoreB))),games=all.filter(g=>Number(g.year)===2026&&Number(g.week)===done()),hero=document.querySelector('.page-hero');
  if(!hero||!games.length||document.getElementById('latest-record-audit'))return;
  const scores=games.flatMap(g=>[{m:g.managerA,s:Number(g.scoreA)},{m:g.managerB,s:Number(g.scoreB)}]),hi=[...scores].sort((a,b)=>b.s-a.s)[0],lo=[...scores].sort((a,b)=>a.s-b.s)[0],margins=games.map(g=>({g,m:Math.abs(Number(g.scoreA)-Number(g.scoreB))})).sort((a,b)=>a.m-b.m),close=margins[0],big=margins.at(-1),comb=[...games].sort((a,b)=>(Number(b.scoreA)+Number(b.scoreB))-(Number(a.scoreA)+Number(a.scoreB)))[0];
  const cur=streaks(all),prior=streaks(all.filter(g=>!(Number(g.year)===2026&&Number(g.week)===done()))),cw=Object.entries(cur).sort((a,b)=>b[1].mw-a[1].mw)[0],pw=Object.entries(prior).sort((a,b)=>b[1].mw-a[1].mw)[0],cl=Object.entries(cur).sort((a,b)=>b[1].ml-a[1].ml)[0],pl=Object.entries(prior).sort((a,b)=>b[1].ml-a[1].ml)[0],changes=[];
  if(cw&&(!pw||cw[1].mw>pw[1].mw))changes.push('NEW RECORD: '+cw[0]+' W'+cw[1].mw+' is the longest regular-season win streak.');
  if(cl&&(!pl||cl[1].ml>pl[1].ml))changes.push('NEW RECORD: '+cl[0]+' L'+cl[1].ml+' is the longest regular-season losing streak.');
  const rec=g=>{const a=Number(g.scoreA),b=Number(g.scoreB);return a>=b?g.managerA+' '+a.toFixed(2)+'–'+b.toFixed(2)+' '+g.managerB:g.managerB+' '+b.toFixed(2)+'–'+a.toFixed(2)+' '+g.managerA};
  hero.insertAdjacentHTML('afterend','<section class="section alt" id="latest-record-audit"><div class="shell"><div class="section-head"><div><p class="eyebrow dark">WEEKLY RECORD AUDIT</p><h2>Week '+done()+' checked against the vault</h2></div><p class="section-intro">'+esc(changes.length?changes.join(' '):'No tracked all-time record changed this week.')+'</p></div><div class="grid3">'+card(hi.m+' · '+hi.s.toFixed(2),'Week '+done()+' high.','WEEKLY HIGH')+card(lo.m+' · '+lo.s.toFixed(2),'Week '+done()+' low.','WEEKLY LOW')+card(rec(big.g),'Margin '+big.m.toFixed(2)+'.','BIGGEST MARGIN')+card(rec(close.g),'Margin '+close.m.toFixed(2)+'.','CLOSEST FINISH')+card((Number(comb.scoreA)+Number(comb.scoreB)).toFixed(2)+' combined','Highest combined game of Week '+done()+'.','SHOOTOUT')+card((cw?.[0]||'—')+' W'+(cw?.[1].mw||0),(cl?.[0]||'—')+' L'+(cl?.[1].ml||0),'STREAK RECORDS')+'</div></div></section>');
}
function schedule(E){
  if(page()!=='schedule')return;
  const map=new Map((E.realResults?E.realResults():[]).filter(g=>(g.stage||'Regular Season')==='Regular Season').map(g=>[(Number(g.week)||0)+'|'+pair(g.teamA||g.home,g.teamB||g.away),g]));
  const lede=document.querySelector('.page-hero .lede');if(lede)lede.textContent='Weeks 1–'+done()+' are locked with final results. Week '+week()+' is the current slate; future weeks keep the latest H2H context.';
  for(const c of document.querySelectorAll('.schedule-team-card')){const team=c.querySelector('h3')?.textContent.trim();for(const line of c.querySelectorAll('.schedule-line')){const w=Number((line.getAttribute('href')||'').match(/week=(\d+)/)?.[1]||0),opp=line.querySelector('.schedule-opponent b')?.textContent.trim(),g=map.get(w+'|'+pair(team,opp)),tags=line.querySelector('.schedule-tags');if(!g||!tags||tags.querySelector('.final-result-tag'))continue;const same=(g.teamA||g.home)===team,sa=Number(same?(g.scoreA??g.homeScore):(g.scoreB??g.awayScore)),sb=Number(same?(g.scoreB??g.awayScore):(g.scoreA??g.homeScore));tags.insertAdjacentHTML('afterbegin','<em class="final-result-tag">'+(sa>sb?'W':'L')+' · '+sa.toFixed(2)+'–'+sb.toFixed(2)+'</em>')}}
  for(const c of document.querySelectorAll('.schedule-week-card')){const w=Number((c.querySelector('.schedule-week-head span')?.textContent||'').match(/\d+/)?.[0]||0);for(const row of c.querySelectorAll('.schedule-master-game')){const names=[...row.querySelectorAll('b')].map(x=>x.textContent.trim()),g=map.get(w+'|'+pair(names[0],names[1])),box=row.querySelector('div:last-child');if(!g||!box||box.querySelector('.final-result-tag'))continue;const same=(g.teamA||g.home)===names[0],sa=Number(same?(g.scoreA??g.homeScore):(g.scoreB??g.awayScore)),sb=Number(same?(g.scoreB??g.awayScore):(g.scoreA??g.homeScore));box.insertAdjacentHTML('afterbegin','<em class="final-result-tag">FINAL · '+sa.toFixed(2)+'–'+sb.toFixed(2)+'</em>')}}
}
function franchise(E){
  if(page()!=='franchise')return;
  const manager=new URLSearchParams(location.search).get('manager');if(!manager)return;
  const team=(Y().teams||[]).find(t=>t.manager===manager)?.team;if(!team)return;
  const results=(E.realResults?E.realResults():[]).filter(g=>(g.stage||'Regular Season')==='Regular Season'&&[g.teamA||g.home,g.teamB||g.away].includes(team)).sort((a,b)=>Number(b.week||0)-Number(a.week||0));
  const last=results[0],up=(Y().liveMatchupProjections||[]).find(m=>[m.teamA,m.teamB].includes(team)),hero=document.querySelector('.page-hero');
  if(!hero||document.getElementById('franchise-current-week'))return;
  let lastText='No completed 2026 result yet.';
  if(last){const same=(last.teamA||last.home)===team,sa=Number(same?(last.scoreA??last.homeScore):(last.scoreB??last.awayScore)),sb=Number(same?(last.scoreB??last.awayScore):(last.scoreA??last.homeScore)),opp=same?(last.teamB||last.away):(last.teamA||last.home);lastText='Week '+last.week+': '+(sa>sb?'W ':'L ')+sa.toFixed(2)+'–'+sb.toFixed(2)+' vs '+opp;}
  let nextText='Upcoming matchup unavailable.';
  if(up){const same=up.teamA===team,opp=same?up.teamB:up.teamA,proj=Number(same?up.projA:up.projB),oppProj=Number(same?up.projB:up.projA);nextText='Week '+week()+': vs '+opp+(Number.isFinite(proj)&&Number.isFinite(oppProj)?' · Yahoo '+proj.toFixed(2)+'–'+oppProj.toFixed(2):'');}
  hero.insertAdjacentHTML('afterend','<section class="section alt" id="franchise-current-week"><div class="shell"><div class="notice"><b>Current week:</b> '+esc(lastText)+' <b>Next:</b> '+esc(nextText)+'</div></div></section>');
}

function apply(){const E=window.MEFFL_ENGINE||{};if(!window.SEASON_2026)return;h2h(E);records(E);schedule(E);franchise(E)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(apply,25);setTimeout(apply,350)},{once:true});else{setTimeout(apply,25);setTimeout(apply,350)}
window.MEFFL_APPLY_WEDNESDAY_SITE=apply;
})();