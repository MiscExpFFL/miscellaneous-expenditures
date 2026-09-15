(function(){
'use strict';
const Y=window.SEASON_2026||{},E=window.MEFFL_ENGINE||{};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
function sectionByTitle(title){
  return [...document.querySelectorAll('section')].find(s=>[...s.querySelectorAll('h2')].some(h=>h.textContent.trim()===title));
}
function currentPower(){
  if(document.body.dataset.page!=='power'||!E.powerMetrics)return;
  const rows=[...E.powerMetrics()].sort((a,b)=>(a.powerRank||99)-(b.powerRank||99));
  const streak=E.streaks?E.streaks():{};
  const sec=sectionByTitle('Live Power Index');
  const tbody=sec?.querySelector('tbody');
  if(tbody)tbody.innerHTML=rows.map((t,i)=>`<tr><td><b>${t.powerRank||i+1}</b></td><td>${E.badge?E.badge(t.team,'xs'):''} <b>${esc(t.team)}</b><div class="table-sub">${esc(t.manager)}</div></td><td>${t.gp?`${t.w}-${t.l}`:'0-0'}</td><td>${t.gp?(t.pf/t.gp).toFixed(2):'—'}</td><td>${esc(streak[t.manager]||'—')}</td><td><b>${n(t.powerIndex).toFixed(1)}</b></td></tr>`).join('');
  const intro=sec?.querySelector('.section-intro');
  if(intro)intro.textContent='Week 1 results are live. Record, scoring and current form now move the index while the preseason board remains frozen below as a receipt.';
}
function oddsRows(field,red){
  const sim=[...(E.simulate?E.simulate():[])].sort((a,b)=>b.playoff-a.playoff);
  return sim.map(x=>`<div class="odds-row"><strong>${esc(x.team)}<span class="table-sub">${esc(x.manager)}</span></strong><div class="bar${red?' red':''}"><span style="width:${Math.min(100,n(x[field]))}%"></span></div><b>${n(x[field])}%</b></div>`).join('');
}
function refreshOdds(){
  if(document.body.dataset.page!=='odds'||!E.simulate)return;
  const map=[['Make the bracket','playoff',false],['Earn a first-round bye','bye',false],['Win the whole damn thing','title',false],['Press-conference risk','press',true]];
  for(const [title,field,red] of map){const sec=sectionByTitle(title),row=sec?.querySelector('.odds-row');if(row?.parentElement)row.parentElement.innerHTML=oddsRows(field,red)}
  const sim=[...E.simulate()].sort((a,b)=>b.playoff-a.playoff),st=Object.fromEntries((E.currentStandings?E.currentStandings():[]).map(x=>[x.team,x]));
  const full=sectionByTitle('Full model board'),tbody=full?.querySelector('tbody');
  if(tbody)tbody.innerHTML=sim.map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.team)}</b><div class="table-sub">${esc(x.manager)}</div></td><td>${st[x.team]?.gp?`${st[x.team].w}-${st[x.team].l}`:'0-0'}</td><td><b>${x.playoff}%</b></td><td>${x.bye}%</td><td>${x.title}%</td><td>${esc(x.avgSeed)}</td><td>${x.seedLow}–${x.seedHigh}</td><td>${x.press}%</td></tr>`).join('');
  const hero=document.querySelector('.page-hero .lede');if(hero)hero.textContent='Week 1 is fixed in the ledger. The remaining schedule is simulated from the updated live strength board for playoffs, byes, title equity and press-conference risk.';
}
function scoredGames(){return (E.allGames?E.allGames():[]).filter(g=>Number.isFinite(Number(g.scoreA))&&Number.isFinite(Number(g.scoreB)))}
function refreshH2H(){
  if(document.body.dataset.page!=='h2h')return;
  const games=scoredGames().sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||((Number(b.week)||99)-(Number(a.week)||99)));
  const sec=sectionByTitle('Every receipt');if(!sec)return;
  const eyebrow=sec.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent=`${games.length}-GAME ARCHIVE`;
  const tbody=sec.querySelector('tbody');
  if(tbody)tbody.innerHTML=games.map(g=>`<tr><td>${esc(g.year)}</td><td>${esc(g.round||(`Week ${g.week||''}`))}</td><td>${esc(g.stage||'Regular Season')}</td><td class="win">${esc(g.winner||g.managerA||'—')}</td><td>${n(g.scoreA).toFixed(2)}–${n(g.scoreB).toFixed(2)}</td><td class="loss">${esc(g.loser||g.managerB||'—')}</td></tr>`).join('');
}
function careerRows(){
  const managers=[...new Set([...(Y.teams||[]).map(t=>t.manager),...scoredGames().flatMap(g=>[g.managerA,g.managerB])].filter(Boolean))];
  const rows=Object.fromEntries(managers.map(m=>[m,{manager:m,seasons:new Set(),w:0,l:0,pf:0,pa:0,postW:0,postL:0,titles:0,finals:0,toilets:0}]));
  for(const g of scoredGames()){
    for(const m of [g.managerA,g.managerB]){const r=rows[m];if(!r)continue;r.seasons.add(g.year);const won=(g.winner||g.managerA)===m,mine=g.managerA===m?n(g.scoreA):n(g.scoreB),opp=g.managerA===m?n(g.scoreB):n(g.scoreA);if(String(g.stage||'Regular Season')==='Regular Season'){r.w+=won?1:0;r.l+=won?0:1;r.pf+=mine;r.pa+=opp}else{r.postW+=won?1:0;r.postL+=won?0:1}}
    if(String(g.stage||'')==='Postseason'){
      const w=g.winner||g.managerA,l=g.loser||g.managerB,round=String(g.round||'');
      if(round==='Final'){if(rows[w]){rows[w].titles++;rows[w].finals++}if(rows[l])rows[l].finals++}
      if(/9th Place|Toilet/i.test(round)&&rows[l])rows[l].toilets++;
    }
  }
  return Object.values(rows).map(r=>({...r,seasons:r.seasons.size,pct:r.w/(r.w+r.l||1)})).sort((a,b)=>b.w-a.w||b.pf-a.pf||a.manager.localeCompare(b.manager));
}
function refreshRecords(){
  if(document.body.dataset.page!=='records')return;
  const sec=sectionByTitle('Career standings'),tbody=sec?.querySelector('tbody');
  const rows=careerRows();
  if(tbody)tbody.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.manager)}</b></td><td>${r.seasons}</td><td>${r.w}-${r.l}</td><td>${(r.pct*100).toFixed(1)}%</td><td>${r.pf.toFixed(2)}</td><td>${r.pa.toFixed(2)}</td><td>${r.postW}-${r.postL}</td><td>${r.titles}</td><td>${r.finals}</td><td>${r.toilets}</td></tr>`).join('');
  const ledger=sectionByTitle('League ledger');if(ledger&&E.renderLeaderboards){const grid=ledger.querySelector('.leaderboard-grid');if(grid)grid.outerHTML=E.renderLeaderboards()}
}
function refreshTrophies(){
  if(document.body.dataset.page!=='trophies')return;
  const table=document.querySelector('table tbody');if(!table)return;
  const rows=careerRows().sort((a,b)=>b.titles-a.titles||b.finals-a.finals||b.w-a.w||b.pf-a.pf);
  table.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.manager)}</b></td><td>${r.titles}</td><td>${r.finals}</td><td>—</td><td>${r.w}-${r.l}</td><td>${r.postW}-${r.postL}</td><td>${r.toilets}</td></tr>`).join('');
}
function run(){currentPower();refreshOdds();refreshH2H();refreshRecords();refreshTrophies()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
