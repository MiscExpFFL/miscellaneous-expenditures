(function(){
  function enhanceMenu(menu){
    const summary=menu.querySelector('summary');
    if(!summary)return;
    const sync=()=>summary.setAttribute('aria-expanded',menu.open?'true':'false');
    summary.setAttribute('aria-haspopup','menu');sync();
    menu.addEventListener('toggle',sync);
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.open=false;sync()}));
    document.addEventListener('click',ev=>{if(menu.open&&!menu.contains(ev.target)){menu.open=false;sync()}});
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&menu.open){menu.open=false;sync();summary.focus()}});
  }
  document.querySelectorAll('details.mobile-menu').forEach(enhanceMenu);
  document.querySelectorAll('.table-wrap').forEach(x=>{if(!x.hasAttribute('tabindex'))x.tabIndex=0;x.setAttribute('role','region');x.setAttribute('aria-label','Scrollable data table')});
})();
