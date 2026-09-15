(function(){
  'use strict';

  function applyTuesdayLayout(){
    const page=document.body?.dataset?.page;

    // Homepage order: Season Storylines should lead the weekly editorial package,
    // immediately above the completed-week receipts. Story So Far remains parked
    // below Not Yahoo's Rankings by the main Tuesday update script.
    if(page==='home'){
      const storylines=document.querySelector('.storylines-section');
      const receipts=document.querySelector('.home-tuesday-receipts');
      if(storylines&&receipts&&storylines.nextElementSibling!==receipts){
        receipts.insertAdjacentElement('beforebegin',storylines);
      }
    }

    // The Franchise Stock Market is a Tuesday closeout item. Its prices/ranks/signals
    // are already calculated from the live Power + 30,000-run odds model; stamp the
    // section so it is clear that the board was repriced after the completed week.
    if(page==='home'||page==='warroom'){
      const stocks=document.querySelector('.stock-market-section');
      if(stocks){
        const note=stocks.querySelector('.stock-model-note');
        if(note){
          note.innerHTML='<b>Week 1 Tuesday close.</b> Franchise prices, ranks and signals have been repriced after the Week 1 finals using the live Power Index and the same 30,000-run playoff model used by Odds and the War Room.';
        }
      }
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(applyTuesdayLayout,0),{once:true});
  }else{
    setTimeout(applyTuesdayLayout,0);
  }
})();
