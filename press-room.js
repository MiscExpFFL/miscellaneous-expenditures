(function(){
  const Y=window.SEASON_2026||{};
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const published=Object.entries(Y.weekly||{}).map(([w,d])=>({week:Number(w),...d})).filter(d=>d.writeup&&!/write-up pending/i.test(d.headline||'')&&!/bracket TBD/i.test(d.headline||'')).sort((a,b)=>b.week-a.week);
  const desk=document.getElementById('press-league-desk');
  if(desk){desk.innerHTML=published.length?published.map(d=>`<a class="press-dispatch" href="week.html?week=${d.week}"><div><span>WEEK ${d.week}</span><b>${e(d.headline||`Week ${d.week}`)}</b><small>${e((d.status||'WRITE-UP').toUpperCase())}</small></div><strong>Read →</strong></a>`).join(''):'<div class="empty-state">No published weekly dispatches yet.</div>'}
  const quotes=document.getElementById('press-quote-archive'),quoteRows=published.filter(d=>d.quote&&!/^pending\.?$/i.test(String(d.quote).trim()));
  if(quotes){quotes.innerHTML=quoteRows.length?quoteRows.map(d=>`<div class="card"><p class="eyebrow dark">QUOTE OF THE WEEK</p><h3>Week ${d.week}</h3><p>“${e(String(d.quote).replace(/^[“\"]|[”\"]$/g,''))}”</p></div>`).join(''):'<div class="empty-state">Weekly quotes will accumulate here as they are published.</div>'}
  const receipts=document.getElementById('press-prediction-receipts'),snaps=Object.values(Y.predictionSnapshots||{}).sort((a,b)=>Number(b.week)-Number(a.week));
  if(receipts){receipts.innerHTML=snaps.length?snaps.map(s=>`<div class="press-prediction-row"><span>WEEK ${e(s.week)}</span><b>${(s.matchups||[]).length} forecast matchups</b><small>${e(s.phase||'FORECAST RECEIPT')}</small></div>`).join(''):'<div class="empty-state">The first forecast will create the prediction receipt archive.</div>'}
})();
