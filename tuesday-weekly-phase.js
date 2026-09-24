(function(){
  'use strict';
  const Y=window.SEASON_2026||{};if(Number(Y.week||1)!==1)return;
  function txt(el,from,to){if(el&&el.textContent.trim()===from)el.textContent=to}
  function apply(){
    const page=document.body?.dataset?.page;
    const week=1;
    if(page==='home'){
      document.querySelectorAll('h2').forEach(h=>txt(h,'Latest Weekly Write-Up',`Week ${week} Results Recap`));
      document.querySelectorAll('a').forEach(a=>{if(a.textContent.trim()===`Read full Week ${week} write-up`)a.textContent=`Read full Week ${week} recap`});
    }
    if(page==='weeks'){
      document.querySelectorAll('h2').forEach(h=>txt(h,`Week ${week} Write-Up`,`Week ${week} Results Recap`));
      document.querySelectorAll('.published-pill').forEach(x=>{if(/FULL WRITE-UP/i.test(x.textContent))x.textContent='RESULTS RECAP'});
      document.querySelectorAll('.weekly-full-article .eyebrow').forEach(x=>{if(/THE WRITE-UP/i.test(x.textContent))x.textContent='THE RECAP'});
    }
    if(page==='week'&&new URLSearchParams(location.search).get('week')==='1'){
      document.querySelectorAll('.weekly-full-article .eyebrow').forEach(x=>{if(/THE WRITE-UP/i.test(x.textContent))x.textContent='RESULTS RECAP'});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0),{once:true});else setTimeout(apply,0);
})();
