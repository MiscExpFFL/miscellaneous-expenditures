(function(){
  const Y=window.SEASON_2026||{};
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=v=>n(v).toFixed(2);
  const pick=(a,b,sa,sb)=>n(sa)===n(sb)?'Tie':n(sa)>n(sb)?a:b;
  const stamp=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})};
  const published=Object.entries(Y.weekly||{}).map(([w,d])=>({week:Number(w),...d})).filter(d=>d.writeup&&!/write-up pending/i.test(d.headline||'')&&!/bracket TBD/i.test(d.headline||'')).sort((a,b)=>b.week-a.week);

  const desk=document.getElementById('press-league-desk');
  if(desk){desk.innerHTML=published.length?published.map(d=>`<a class="press-dispatch" href="week.html?week=${d.week}"><div><span>WEEK ${d.week}</span><b>${e(d.headline||`Week ${d.week}`)}</b><small>${e((d.status||'WRITE-UP').toUpperCase())}</small></div><strong>Read →</strong></a>`).join(''):'<div class="empty-state">No published weekly dispatches yet.</div>'}

  const quotes=document.getElementById('press-quote-archive'),quoteRows=published.filter(d=>d.quote&&!/^pending\.?$/i.test(String(d.quote).trim()));
  if(quotes){quotes.classList.add('press-quote-grid');quotes.innerHTML=quoteRows.length?quoteRows.map((d,i)=>`<article class="press-quote-card${i===0?' featured':''}"><div class="press-quote-meta"><span>QUOTE OF THE WEEK</span><b>WEEK ${d.week}</b></div><blockquote>${e(String(d.quote))}</blockquote><a href="week.html?week=${d.week}">Open the Week ${d.week} file →</a></article>`).join(''):'<div class="empty-state">Weekly quotes will accumulate here as they are published.</div>'}

  const receipts=document.getElementById('press-prediction-receipts'),snaps=Object.values(Y.predictionSnapshots||{}).sort((a,b)=>Number(b.week)-Number(a.week));
  if(receipts){receipts.innerHTML=snaps.length?snaps.map(s=>{
    const ms=s.matchups||[], disagreements=ms.filter(m=>pick(m.teamA,m.teamB,m.meA,m.meB)!==pick(m.teamA,m.teamB,m.yahooA,m.yahooB)).length;
    const meAvg=ms.length?ms.reduce((sum,m)=>sum+n(m.meA)+n(m.meB),0)/ms.length:0;
    const yahooAvg=ms.length?ms.reduce((sum,m)=>sum+n(m.yahooA)+n(m.yahooB),0)/ms.length:0;
    const rows=ms.map(m=>{const mePick=pick(m.teamA,m.teamB,m.meA,m.meB),yPick=pick(m.teamA,m.teamB,m.yahooA,m.yahooB),split=mePick!==yPick;return `<div class="press-receipt-matchup"><div class="press-receipt-teams"><b>${e(m.teamA)}</b><span>vs</span><b>${e(m.teamB)}</b>${split?'<em>PICKS SPLIT</em>':''}</div><div class="press-receipt-model"><span>ME FORECAST</span><strong>${fmt(m.meA)}–${fmt(m.meB)}</strong><small>Pick: ${e(mePick)}</small></div><div class="press-receipt-model"><span>YAHOO</span><strong>${fmt(m.yahooA)}–${fmt(m.yahooB)}</strong><small>Pick: ${e(yPick)}</small></div></div>`}).join('');
    return `<article class="press-receipt-card"><header class="press-receipt-head"><div><div class="press-receipt-kickers"><span>WEEK ${e(s.week)}</span><em>${s.locked?'LOCKED RECEIPT':'OPEN RECEIPT'}</em></div><h3>${e(s.phase||'FORECAST RECEIPT')}</h3><p>${stamp(s.capturedAt)?`Captured ${e(stamp(s.capturedAt))}`:''}${s.model?` · ${e(s.model)}`:''}</p></div><a href="predictions.html">Full ledger →</a></header><div class="press-receipt-stats"><div><span>Matchups</span><b>${ms.length}</b></div><div><span>ME / Yahoo splits</span><b>${disagreements}</b></div><div><span>ME avg matchup total</span><b>${fmt(meAvg)}</b></div><div><span>Yahoo avg matchup total</span><b>${fmt(yahooAvg)}</b></div></div><div class="press-receipt-matchups">${rows}</div>${s.source?`<footer>Source: ${e(s.source)}</footer>`:''}</article>`
  }).join(''):'<div class="empty-state">The first forecast will create the prediction receipt archive.</div>'}
})();
