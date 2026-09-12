(()=>{
  'use strict';
  if(document.body.dataset.page!=='home')return;

  function rankingsSection(){
    const direct=document.querySelector('.preseason-board');
    if(direct)return direct;
    return [...document.querySelectorAll('section')].find(section=>
      [...section.querySelectorAll('h1,h2,h3')].some(h=>/not yahoo'?s rankings/i.test(h.textContent||''))
    )||null;
  }

  function place(){
    const tracker=document.getElementById('purdy-mvp-fund');
    const rankings=rankingsSection();
    if(!tracker||!rankings)return false;
    if(tracker.nextElementSibling!==rankings)rankings.before(tracker);
    return true;
  }

  place();
  const observer=new MutationObserver(()=>place());
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',place,{once:true});
  setTimeout(place,250);
  setTimeout(place,1000);
  setTimeout(place,3000);
})();
