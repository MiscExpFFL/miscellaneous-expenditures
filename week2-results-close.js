(function(){
'use strict';
const Y=window.SEASON_2026;if(!Y)return;
const round2=v=>Math.round((Number(v)||0)*100)/100;
const isSkill=p=>['RB','WR','TE'].includes(String(p.pos||'').toUpperCase());
const active=p=>String(p.slot||'').toUpperCase()!=='IR'&&p.points!=null;

const NAME_FIXES={
  'SVDBaller|Final W 20-13 vs':{name:'Jaylen Waddle',pos:'WR'},
  'The Breeder|Final L 14-26 vs':{name:'Ladd McConkey',pos:'WR'},
  'The Breeder|Final W 9-3 @':{name:'Jordan Addison',pos:'WR'},
  'SVDBaller|Sun 5:20 pm vs':{name:'Jaylen Waddle',pos:'WR'},
  'The Breeder|Sun 10:00 am @':{name:'Ladd McConkey',pos:'WR'},
  'The Breeder|Sun 1:05 pm @':{name:'Jordan Addison',pos:'WR'},
  'Premature Ejleculators|J.K. Dobbins':{name:'J.K. Dobbins',pos:'RB'}
};
function patchRows(rows){
  for(const r of (rows||[])){
    for(const p of (r.players||[])){
      const f=NAME_FIXES[`${r.team}|${p.name}`];
      if(f){p.name=f.name;p.pos=f.pos}
    }
  }
}
patchRows(Y.completedLineups);
patchRows(Y.liveRosters);

const LOCKED_FORECAST=[
  {teamA:'Wheat Hill Slow Blows',teamB:'SVDBaller',meA:117.76,meB:111.03,yahooA:113.41,yahooB:107.39},
  {teamA:'Rise of the Pleasure Machines',teamB:'Premature Ejleculators',meA:103.77,meB:106.11,yahooA:100.03,yahooB:107.89},
  {teamA:'SFPAL Junior 49ers',teamB:'The Great Communicator',meA:109.93,meB:107.50,yahooA:109.13,yahooB:108.25},
  {teamA:'Bogota Booger Boys',teamB:'The Breeder',meA:105.91,meB:103.04,yahooA:104.98,yahooB:106.45},
  {teamA:'Jelq Me Jeantly',teamB:'MCFISH',meA:107.74,meB:105.59,yahooA:110.68,yahooB:110.18}
];
const PRIOR_RANK={
  'MCFISH':1,'Wheat Hill Slow Blows':2,'The Breeder':3,'Bogota Booger Boys':4,'SVDBaller':5,
  'Rise of the Pleasure Machines':6,'Jelq Me Jeantly':7,'The Great Communicator':8,
  'Premature Ejleculators':9,'SFPAL Junior 49ers':10
};

function bestByPos(players,pos){
  return players.filter(p=>String(p.pos||'').toUpperCase()===pos)
    .sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0))[0]||null;
}
function combinations(arr,k){
  const out=[];
  function walk(start,need,pick){
    if(need===0){out.push(pick.slice());return}
    for(let i=start;i<=arr.length-need;i++){pick.push(arr[i]);walk(i+1,need-1,pick);pick.pop()}
  }
  walk(0,k,[]);
  return out;
}
function optimalFor(row){
  const players=(row.players||[]).filter(active);
  const qb=bestByPos(players,'QB'),k=bestByPos(players,'K'),def=bestByPos(players,'DEF');
  const skill=players.filter(isSkill);
  let best={points:-Infinity,players:[]};
  for(const combo of combinations(skill,6)){
    const n={RB:0,WR:0,TE:0};combo.forEach(p=>n[String(p.pos||'').toUpperCase()]++);
    if(n.RB<2||n.WR<2||n.TE<1||n.RB>3||n.WR>3||n.TE>2)continue;
    const pts=combo.reduce((s,p)=>s+(Number(p.points)||0),0);
    if(pts>best.points)best={points:pts,players:combo};
  }
  const chosen=[qb,...best.players,k,def].filter(Boolean);
  return {points:round2(chosen.reduce((s,p)=>s+(Number(p.points)||0),0)),players:chosen};
}
const finals=(Y.results||[]).filter(g=>Number(g.week)===2&&String(g.status||'').toUpperCase()==='FINAL');
const scoreByTeam={};
const oppByTeam={};
for(const g of finals){
  const a=g.teamA||g.home,b=g.teamB||g.away,sa=Number(g.scoreA??g.homeScore),sb=Number(g.scoreB??g.awayScore);
  scoreByTeam[a]=sa;scoreByTeam[b]=sb;
  oppByTeam[a]={team:b,score:sb,won:sa>sb};oppByTeam[b]={team:a,score:sa,won:sb>sa};
}
const scoreOrder=Object.entries(scoreByTeam).sort((a,b)=>b[1]-a[1]);
const scoreRank=Object.fromEntries(scoreOrder.map(([t],i)=>[t,i+1]));
const allPlay={};
for(const [team,score] of Object.entries(scoreByTeam)){
  let w=0,l=0,t=0;
  for(const [other,s] of Object.entries(scoreByTeam)){if(other===team)continue;if(score>s)w++;else if(score<s)l++;else t++}
  allPlay[team]={w,l,t,record:`${w}-${l}${t?'-'+t:''}`};
}
const receipts=(Y.completedLineups||[]).filter(r=>Number(r.week)===2).map(r=>{
  const actual=round2(r.starterPoints);
  const optimal=optimalFor(r);
  const starters=(r.players||[]).filter(p=>p.started&&p.points!=null);
  const bench=(r.players||[]).filter(p=>p.bench&&String(p.slot||'').toUpperCase()!=='IR'&&p.points!=null);
  const topStarter=[...starters].sort((a,b)=>Number(b.points)-Number(a.points))[0]||null;
  const topBench=[...bench].sort((a,b)=>Number(b.points)-Number(a.points))[0]||null;
  const starterNames=new Set(starters.map(p=>p.name)),chosenNames=new Set(optimal.players.map(p=>p.name));
  const optimalAdds=optimal.players.filter(p=>!starterNames.has(p.name)).map(p=>({name:p.name,pos:p.pos,points:round2(p.points)}));
  const optimalRemoves=starters.filter(p=>!chosenNames.has(p.name)).map(p=>({name:p.name,pos:p.pos,points:round2(p.points)}));
  const deltas=starters.filter(p=>p.projected!=null).map(p=>({name:p.name,points:round2(p.points),projected:round2(p.projected),delta:round2(Number(p.points)-Number(p.projected))}));
  deltas.sort((a,b)=>b.delta-a.delta);
  const opp=oppByTeam[r.team]||{};
  const standing=(Y.standings||[]).find(s=>s.team===r.team)||{};
  return {
    team:r.team,manager:r.manager,weeklyRank:scoreRank[r.team]||null,
    score:actual,yahooProjection:round2(r.starterProjectedPoints),vsProjection:round2(actual-Number(r.starterProjectedPoints||0)),
    opponent:opp.team||'',opponentScore:round2(opp.score),result:opp.won?'W':'L',margin:round2(Math.abs(actual-Number(opp.score||0))),
    allPlay:allPlay[r.team]||{w:0,l:0,t:0,record:'0-0'},
    standingsRank:Number(standing.rank)||null,standingsMovement:(PRIOR_RANK[r.team]||0)-(Number(standing.rank)||0),
    benchPoints:round2(r.benchPoints),optimal:optimal.points,pointsLeft:round2(optimal.points-actual),
    topStarter:topStarter?{name:topStarter.name,pos:topStarter.pos,points:round2(topStarter.points)}:null,
    topBench:topBench?{name:topBench.name,pos:topBench.pos,points:round2(topBench.points)}:null,
    optimalAdds,optimalRemoves,
    biggestBeatProjection:deltas[0]||null,
    biggestMissProjection:deltas[deltas.length-1]||null
  };
}).sort((a,b)=>a.weeklyRank-b.weeklyRank);

function pick(a,b,sa,sb){return Number(sa)>=Number(sb)?a:b}
let meWins=0,yahooWins=0,meScoreErr=0,yahooScoreErr=0,meMarginErr=0,yahooMarginErr=0,graded=0;
const predictionGames=LOCKED_FORECAST.map(f=>{
  const sa=scoreByTeam[f.teamA],sb=scoreByTeam[f.teamB];
  if(!Number.isFinite(sa)||!Number.isFinite(sb))return {...f,graded:false};
  graded++;
  const actualWinner=sa>sb?f.teamA:f.teamB,mePick=pick(f.teamA,f.teamB,f.meA,f.meB),yahooPick=pick(f.teamA,f.teamB,f.yahooA,f.yahooB);
  if(mePick===actualWinner)meWins++;if(yahooPick===actualWinner)yahooWins++;
  meScoreErr+=Math.abs(f.meA-sa)+Math.abs(f.meB-sb);yahooScoreErr+=Math.abs(f.yahooA-sa)+Math.abs(f.yahooB-sb);
  meMarginErr+=Math.abs((f.meA-f.meB)-(sa-sb));yahooMarginErr+=Math.abs((f.yahooA-f.yahooB)-(sa-sb));
  return {...f,scoreA:sa,scoreB:sb,actualWinner,mePick,yahooPick,meCorrect:mePick===actualWinner,yahooCorrect:yahooPick===actualWinner,graded:true};
});
const byScore=[...receipts].sort((a,b)=>b.score-a.score);
const margins=finals.map(g=>{
  const a=g.teamA||g.home,b=g.teamB||g.away,sa=Number(g.scoreA??g.homeScore),sb=Number(g.scoreB??g.awayScore);
  return {winner:sa>sb?a:b,loser:sa>sb?b:a,winnerScore:Math.max(sa,sb),loserScore:Math.min(sa,sb),margin:round2(Math.abs(sa-sb))};
}).sort((a,b)=>b.margin-a.margin);
const projectionOrder=[...receipts].sort((a,b)=>b.vsProjection-a.vsProjection);
const playerPool=(Y.completedLineups||[]).filter(r=>Number(r.week)===2).flatMap(r=>(r.players||[]).filter(p=>p.started&&p.points!=null).map(p=>({team:r.team,manager:r.manager,name:p.name,pos:p.pos,points:round2(p.points)}))).sort((a,b)=>b.points-a.points);
const lineupFlip=receipts.filter(r=>r.result==='L'&&r.optimal>r.opponentScore).map(r=>({...r,optimalWinMargin:round2(r.optimal-r.opponentScore)}));

Y.week2LineupAnalysis=receipts;
Y.week2Closure={
  week:2,
  status:'CLOSED',
  source:'Yahoo Wednesday collector',
  capturedAt:Y.collectorStatus?.capturedAt||'2026-09-24T05:39:58.869Z',
  scoreReconciled:Boolean(Y.collectorStatus?.validation?.checks?.['Score reconciliation']?.ok),
  resultCount:finals.length,
  results:finals.map(g=>({teamA:g.teamA,teamB:g.teamB,scoreA:Number(g.scoreA),scoreB:Number(g.scoreB),winner:Number(g.scoreA)>Number(g.scoreB)?g.teamA:g.teamB})),
  receipts,
  predictionGrade:{
    graded,me:{correct:meWins,losses:graded-meWins,accuracy:graded?round2(100*meWins/graded):null,avgTeamScoreError:graded?round2(meScoreErr/(graded*2)):null,avgMarginError:graded?round2(meMarginErr/graded):null},
    yahoo:{correct:yahooWins,losses:graded-yahooWins,accuracy:graded?round2(100*yahooWins/graded):null,avgTeamScoreError:graded?round2(yahooScoreErr/(graded*2)):null,avgMarginError:graded?round2(yahooMarginErr/graded):null},
    games:predictionGames
  },
  superlatives:{
    weeklyHigh:byScore[0]||null,
    weeklyLow:byScore[byScore.length-1]||null,
    largestMargin:margins[0]||null,
    closestMargin:margins[margins.length-1]||null,
    bestProjectionBeat:projectionOrder[0]||null,
    worstProjectionMiss:projectionOrder[projectionOrder.length-1]||null,
    topStarter:playerPool[0]||null,
    perfectLineups:receipts.filter(r=>r.pointsLeft===0).map(r=>({team:r.team,manager:r.manager,score:r.score})),
    lineupFlips:lineupFlip
  },
  parserCorrections:[
    {team:'SVDBaller',from:'Final W 20-13 vs',to:'Jaylen Waddle',scope:'Week 2 completed lineup'},
    {team:'The Breeder',from:'Final L 14-26 vs',to:'Ladd McConkey',scope:'Week 2 completed lineup'},
    {team:'The Breeder',from:'Final W 9-3 @',to:'Jordan Addison',scope:'Week 2 completed lineup'},
    {team:'Premature Ejleculators',player:'J.K. Dobbins',fromPos:'K',toPos:'RB',scope:'Week 2 completed lineup'},
    {team:'SVDBaller',from:'Sun 5:20 pm vs',to:'Jaylen Waddle',scope:'Week 3 current roster'},
    {team:'The Breeder',from:'Sun 10:00 am @',to:'Ladd McConkey',scope:'Week 3 current roster'},
    {team:'The Breeder',from:'Sun 1:05 pm @',to:'Jordan Addison',scope:'Week 3 current roster'}
  ]
};
Y.weekly=Y.weekly||{};Y.weekly['2']=Y.weekly['2']||{};
Y.weekly['2'].resultsClosed=true;
Y.weekly['2'].closedAt=Y.week2Closure.capturedAt;
Y.weekly['2'].allPlay=Object.fromEntries(receipts.map(r=>[r.team,r.allPlay.record]));
Y.weekly['2'].lineupReceipts=receipts;
Y.weekly['2'].predictionGrade=Y.week2Closure.predictionGrade;
})();
