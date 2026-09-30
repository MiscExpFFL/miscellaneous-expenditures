(function(){
'use strict';
function patch(E){
  const Y=window.SEASON_2026||{},S=Y.currentModelSnapshot||Y.week4ModelSnapshot;
  if(!S||!E)return E;
  const standings=Object.fromEntries((E.currentStandings?E.currentStandings():Y.standings||[]).map(x=>[x.team,x]));
  if(Array.isArray(S.powerRankings)&&S.powerRankings.length){
    E.powerMetrics=()=>S.powerRankings.map((p,i)=>({...(standings[p.team]||{}),...p,powerRank:p.rank||i+1,powerIndex:Number(p.powerIndex)||0}));
  }
  if(Array.isArray(S.odds)&&S.odds.length){
    E.simulate=()=>S.odds.map(o=>({
      team:o.team,manager:o.manager,
      playoff:Number(o.playoff)||0,bye:Number(o.bye)||0,title:Number(o.title)||0,
      press:Number(o.press??o.toilet)||0,toilet:Number(o.toilet??o.press)||0,
      avgSeed:o.avgSeed??'—',seedLow:o.seedLow??'—',seedHigh:o.seedHigh??'—',
      streak:o.streak||'',remainingSOS:o.remainingSOS??null,need:o.need||'',path:o.path||''
    }));
  }
  window.MEFFL_WEEK4_MODEL_LOCK_ACTIVE=true;
  return E;
}
let engine=window.MEFFL_ENGINE;
if(engine){patch(engine);return;}
Object.defineProperty(window,'MEFFL_ENGINE',{
  configurable:true,
  enumerable:true,
  get(){return engine;},
  set(v){engine=patch(v);}
});
})();
