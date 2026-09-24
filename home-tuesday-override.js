(function(){
  'use strict';
  const Y=window.SEASON_2026||{};if(Number(Y.week||1)!==1)return;
  const WEEK2=[
    ['Wheat Hill Slow Blows',105.19,'SVDBaller',101.37],
    ['Rise of the Pleasure Machines',92.98,'Premature Ejleculators',98.06],
    ['SFPAL Junior 49ers',105.66,'The Great Communicator',100.69],
    ['Bogota Booger Boys',100.21,'The Breeder',102.98],
    ['Jelq Me Jeantly',106.92,'MCFISH',103.68]
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function receipts(){return `<section class="section home-tuesday-receipts"><div class="shell"><div class="section-head"><div><p class="eyebrow dark">WEEK 1 FINAL</p><h2>Week 1 receipts</h2></div><p class="section-intro">The first real standings are in. Five teams are 1-0, five are 0-1, and the preseason excuses are over.</p></div><div class="grid3"><div class="card"><p class="eyebrow dark">SCOREBOARD KING</p><h3>MCFISH · 129.00</h3><p>Danny posted the league high and went 9-0 in all-play.</p></div><div class="card"><p class="eyebrow dark">BIGGEST BLOWOUT</p><h3>Wheat · +38.20</h3><p>Tommy beat SFPAL 123.16-84.96 after both locked systems picked Tom.</p></div><div class="card"><p class="eyebrow dark">GAME OF THE WEEK</p><h3>Breeder · +3.04</h3><p>Patrick survived Owen 115.76-112.72 in the closest finish of the week.</p></div></div><div class="notice red" style="margin-top:18px"><b>Prediction damage:</b> ME finished 1-4. Yahoo finished 2-3. Thursday locks the Week 2 ME forecast after waivers.</div></div></section>`}
  function week2(){return `<section class="section alt home-week2-board"><div class="shell"><div class="section-head"><div><p class="eyebrow dark">TUESDAY WAIVER WINDOW</p><h2>Week 2 early Yahoo board</h2></div><p class="section-intro">Current Yahoo projections only. ME picks lock Thursday after waivers.</p></div><div class="grid2">${WEEK2.map(m=>`<div class="card"><h3>${esc(m[0])} ${m[1].toFixed(2)}</h3><p>vs. ${esc(m[2])} <b>${m[3].toFixed(2)}</b></p></div>`).join('')}</div></div></section>`}
  function patch(){
    if(document.body?.dataset?.page!=='home') return;
    const hero=document.querySelector('.hero');
    if(hero){
      const eyebrow=hero.querySelector('.eyebrow');
      const lede=hero.querySelector('.lede');
      const actions=hero.querySelector('.hero-actions');
      if(eyebrow)eyebrow.textContent='2026 WEEK 2 · TUESDAY UPDATE';
      if(lede)lede.textContent='Week 1 is in the books. The standings are real, the waiver window is open, and Thursday locks the Week 2 forecast.';
      if(actions)actions.innerHTML='<a class="button primary" href="weeks.html#latest-writeup">Read the Week 1 Recap</a><a class="button ghost" href="waiver-wire.html">Waiver Wire</a><a class="button ghost" href="season-2026.html">2026 War Room</a>';
    }
    const kickoff=[...document.querySelectorAll('section h2')].find(x=>x.textContent.trim()==='Tonight starts the receipts');
    if(kickoff){const s=kickoff.closest('section'); if(s)s.outerHTML=receipts();}
    else if(!document.querySelector('.home-tuesday-receipts')){
      const h=hero||document.querySelector('.site-head');
      if(h)h.insertAdjacentHTML('afterend',receipts());
    }
    if(!document.querySelector('.home-week2-board')){
      const weekly=document.querySelector('.home-weekly-section');
      const story=[...document.querySelectorAll('section h2')].find(x=>/story/i.test(x.textContent||''))?.closest('section');
      const anchor=weekly||story||document.querySelector('.preseason-board');
      if(anchor)anchor.insertAdjacentHTML('beforebegin',week2());
    }
  }
  patch();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});
  setTimeout(patch,0);
})();
