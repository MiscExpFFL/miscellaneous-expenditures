(()=>{
  'use strict';
  const PAGE=document.body.dataset.page;
  if(PAGE!=='home'&&PAGE!=='odds')return;
  const DATA_URL='data/purdy-mvp.json';
  const TICKET=1900;
  const fmtOdds=n=>Number.isFinite(Number(n))?`${Number(n)>=0?'+':''}${Math.round(Number(n))}`:'—';
  const fmtMoney=n=>Number.isFinite(Number(n))?`$${Number(n).toLocaleString('en-US')}`:'—';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function relativeTime(iso){
    if(!iso)return 'Waiting for first market move';
    const ms=Date.now()-new Date(iso).getTime();
    if(!Number.isFinite(ms))return 'Updated recently';
    const mins=Math.max(0,Math.round(ms/60000));
    if(mins<2)return 'Last market move: just now';
    if(mins<60)return `Last market move: ${mins} min ago`;
    const hrs=Math.round(mins/60);if(hrs<36)return `Last market move: ${hrs} hr${hrs===1?'':'s'} ago`;
    const days=Math.round(hrs/24);return `Last market move: ${days} day${days===1?'':'s'} ago`;
  }
  function comparison(live){
    if(!Number.isFinite(Number(live)))return 'Waiting for the first live market update.';
    const n=Math.round(Number(live)),diff=Math.abs(TICKET-n);
    if(n<TICKET)return `Market has shortened ${diff} points from our +1900 ticket.`;
    if(n>TICKET)return `Market has drifted ${diff} points longer than our +1900 ticket.`;
    return 'Live market is exactly even with our +1900 ticket.';
  }
  function baseMarkup(d,expanded=false){
    const live=Number(d?.liveMarket?.american),hasLive=Number.isFinite(live);
    const bet=d?.bet||{stake:200,oddsAmerican:1900,payout:3800};
    return `<section class="section purdy-fund-section" id="purdy-mvp-fund"><div class="shell"><article class="purdy-fund-card"><div class="purdy-fund-head"><div><p class="purdy-fund-kicker">LEAGUE FUTURES</p><h2>${esc(d?.title||'Miscellaneous Expenditures HK Lounge Orgy Fund')}</h2><p>Brock Purdy · NFL MVP</p></div><span class="purdy-fund-live-dot">Live tracker</span></div><div class="purdy-fund-grid"><div class="purdy-fund-stat"><span class="purdy-fund-label">League Bet</span><div class="purdy-fund-value">${fmtMoney(bet.stake)} <span style="font-size:.58em;font-weight:750">at ${fmtOdds(bet.oddsAmerican)}</span></div><span class="purdy-fund-sub">Payout: <b>${fmtMoney(bet.payout)}</b></span></div><div class="purdy-fund-stat"><span class="purdy-fund-label">Live Market</span><div class="purdy-fund-value market" data-purdy-market>${hasLive?fmtOdds(live):'—'}</div><span class="purdy-fund-sub">${hasLive?'Auto-refreshed from the live feed.':'Waiting for first successful update.'}</span></div><div class="purdy-fund-stat"><span class="purdy-fund-label">Ticket vs. Live Market</span><div class="purdy-fund-value" style="font-size:1.08rem;line-height:1.35;letter-spacing:0" data-purdy-compare>${comparison(hasLive?live:null)}</div></div></div>${expanded?chartMarkup(d):''}<div class="purdy-fund-note">Auto-checks every 5 minutes · <span data-purdy-time>${relativeTime(d?.lastMarketMoveAt)}</span></div></article></div></section>`;
  }
  function chartMarkup(d){
    const hist=Array.isArray(d?.history)?d.history.filter(x=>Number.isFinite(Number(x.american))&&x.at):[];
    if(hist.length<2)return `<div class="purdy-fund-chart-wrap"><div class="purdy-fund-chart-title"><h3>Purdy MVP market history</h3><span>Live Market vs. our +1900 ticket</span></div><p class="purdy-fund-wait">The chart will start building after the live market moves at least twice.</p></div>`;
    const pts=hist.length>120?hist.filter((_,i)=>i===hist.length-1||i%Math.ceil(hist.length/120)===0):hist;
    const W=900,H=270,L=58,R=24,T=22,B=38;
    const vals=[TICKET,...pts.map(x=>Number(x.american))];
    let min=Math.min(...vals),max=Math.max(...vals);if(min===max){min-=100;max+=100}
    const pad=Math.max(75,(max-min)*.12);min-=pad;max+=pad;
    const x=i=>L+(W-L-R)*(pts.length===1?0:i/(pts.length-1));
    const y=v=>T+(H-T-B)*(max-v)/(max-min);
    const path=pts.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(Number(p.american)).toFixed(1)}`).join(' ');
    const ticks=4;let grid='';
    for(let i=0;i<=ticks;i++){const v=max-(max-min)*i/ticks,yy=y(v);grid+=`<line class="purdy-fund-gridline" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"></line><text class="purdy-fund-axis" x="${L-8}" y="${yy+4}" text-anchor="end">${esc(fmtOdds(v))}</text>`}
    const ty=y(TICKET),last=pts[pts.length-1];
    return `<div class="purdy-fund-chart-wrap"><div class="purdy-fund-chart-title"><h3>Purdy MVP market history</h3><span>Live Market vs. our +1900 ticket</span></div><svg class="purdy-fund-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Brock Purdy MVP live market history compared with the league's plus 1900 ticket">${grid}<line class="purdy-fund-ticket-line" x1="${L}" y1="${ty}" x2="${W-R}" y2="${ty}"></line><text class="purdy-fund-axis" x="${W-R}" y="${Math.max(14,ty-7)}" text-anchor="end">OUR BET +1900</text><path class="purdy-fund-market-line" d="${path}"></path><circle class="purdy-fund-dot" cx="${x(pts.length-1)}" cy="${y(Number(last.american))}" r="5"></circle><text class="purdy-fund-axis" x="${L}" y="${H-12}">${esc(new Date(pts[0].at).toLocaleDateString('en-US',{month:'short',day:'numeric'}))}</text><text class="purdy-fund-axis" x="${W-R}" y="${H-12}" text-anchor="end">${esc(new Date(last.at).toLocaleDateString('en-US',{month:'short',day:'numeric'}))}</text></svg><div class="purdy-fund-legend"><span><i></i>Live Market</span><span class="ticket"><i></i>Our Bet +1900</span></div></div>`;
  }
  function mount(d){
    document.getElementById('purdy-mvp-fund')?.remove();
    const wrap=document.createElement('div');wrap.innerHTML=baseMarkup(d,PAGE==='odds');const node=wrap.firstElementChild;
    if(PAGE==='home'){
      const hero=document.querySelector('.hero');if(hero)hero.insertAdjacentElement('afterend',node);else document.querySelector('footer')?.before(node);
    }else{
      const hero=document.querySelector('.page-hero');if(hero)hero.insertAdjacentElement('afterend',node);else document.querySelector('footer')?.before(node);
    }
  }
  async function refresh(){
    try{
      const r=await fetch(`${DATA_URL}?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();mount(d);
    }catch(err){
      console.warn('Purdy MVP tracker:',err);
      if(!document.getElementById('purdy-mvp-fund'))mount({title:'Miscellaneous Expenditures HK Lounge Orgy Fund',bet:{stake:200,oddsAmerican:1900,payout:3800},liveMarket:null,history:[]});
      const note=document.querySelector('#purdy-mvp-fund .purdy-fund-note');if(note)note.innerHTML='Auto-checks every 5 minutes · <span class="purdy-fund-error">Live market feed temporarily unavailable</span>';
    }
  }
  refresh();
  setInterval(refresh,60000);
})();
