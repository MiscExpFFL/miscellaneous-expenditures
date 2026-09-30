(function(){
'use strict';
const Y=window.SEASON_2026;if(!Y)return;
const S={
  week:4,
  completedWeek:3,
  capturedAt:'2026-09-30T14:30:52.191Z',
  source:'Wednesday post-waiver Yahoo collector',
  model:'ME Power Blend v1 · Week 4 rollover',
  methodology:{
    power:'Tempered hybrid of preseason roster baseline, 2026 record, points scored, current Week 4 Yahoo roster projection and Week 3 form. Three completed games raise the live-results weight from the Week 3 snapshot.',
    forecast:'Yahoo Week 4 team projections tempered by league mean and current Power Index separation.',
    odds:'Week 4 playoff/title/bye/toilet board repriced from current record, points-for tiebreak strength, current power and remaining season uncertainty.',
    stock:'Franchise stock repriced from current Power Index, playoff/title equity, bye equity, recent form and preseason baseline.'
  },
  inputs:{completedWeek:3,leaguePpg:110.03,meanYahoo:109.85,liveWeight:37.5},
  powerRankings:[
    {rank:1,previousRank:1,movement:0,team:'Wheat Hill Slow Blows',manager:'Tommy',powerIndex:92.64,previousPowerIndex:82.15,powerChange:10.49,components:{preseason:75.05,record:100,scoring:100,roster:94.39,recent:100,liveWeight:37.5}},
    {rank:2,previousRank:8,movement:6,team:'MCFISH',manager:'Danny',powerIndex:79.79,previousPowerIndex:52.91,powerChange:26.88,components:{preseason:34.41,record:100,scoring:94.47,roster:95.74,recent:87.66,liveWeight:37.5}},
    {rank:3,previousRank:3,movement:0,team:'SFPAL Junior 49ers',manager:'Tom',powerIndex:75.70,previousPowerIndex:63.89,powerChange:11.81,components:{preseason:62.99,record:66.67,scoring:79.68,roster:93.53,recent:79.85,liveWeight:37.5}},
    {rank:4,previousRank:5,movement:1,team:'Rise of the Pleasure Machines',manager:'Christopher',powerIndex:73.96,previousPowerIndex:59.32,powerChange:14.64,components:{preseason:65.85,record:33.33,scoring:90.04,roster:96.68,recent:89.91,liveWeight:37.5}},
    {rank:5,previousRank:2,movement:-3,team:'SVDBaller',manager:'Harry',powerIndex:72.86,previousPowerIndex:70.51,powerChange:2.35,components:{preseason:71.19,record:33.33,scoring:83.40,roster:100,recent:78.11,liveWeight:37.5}},
    {rank:6,previousRank:4,movement:-2,team:'Bogota Booger Boys',manager:'Andrew',powerIndex:68.22,previousPowerIndex:59.33,powerChange:8.89,components:{preseason:57.15,record:33.33,scoring:81.28,roster:90.82,recent:85.61,liveWeight:37.5}},
    {rank:7,previousRank:7,movement:0,team:'The Breeder',manager:'Patrick',powerIndex:67.64,previousPowerIndex:55.14,powerChange:12.50,components:{preseason:38.26,record:66.67,scoring:84.25,roster:89.05,recent:67.18,liveWeight:37.5}},
    {rank:8,previousRank:10,movement:2,team:'Jelq Me Jeantly',manager:'Owen',powerIndex:61.13,previousPowerIndex:42.49,powerChange:18.64,components:{preseason:44.59,record:33.33,scoring:72.94,roster:91.36,recent:69.73,liveWeight:37.5}},
    {rank:9,previousRank:6,movement:-3,team:'Premature Ejleculators',manager:'Matty B.',powerIndex:59.84,previousPowerIndex:55.33,powerChange:4.51,components:{preseason:49.44,record:33.33,scoring:77.55,roster:87.98,recent:51.35,liveWeight:37.5}},
    {rank:10,previousRank:9,movement:-1,team:'The Great Communicator',manager:'Matt F.',powerIndex:51.31,previousPowerIndex:46.63,powerChange:4.68,components:{preseason:50.32,record:0,scoring:68.68,roster:79.65,recent:60.42,liveWeight:37.5}}
  ],
  odds:[
    {team:'Wheat Hill Slow Blows',manager:'Tommy',playoff:99.7,bye:87.0,title:34.0,toilet:0.1,avgSeed:1.55,streak:'W3',need:'Protect the inside track to a first-round bye.'},
    {team:'MCFISH',manager:'Danny',playoff:98.9,bye:78.0,title:25.0,toilet:0.2,avgSeed:1.95,streak:'W3',need:'Turn the 3-0 start into a top-two seed.'},
    {team:'SFPAL Junior 49ers',manager:'Tom',playoff:83.0,bye:20.0,title:10.0,toilet:3.0,avgSeed:4.10,streak:'W2',need:'Stay above the cut and keep banking points-for.'},
    {team:'The Breeder',manager:'Patrick',playoff:72.0,bye:10.0,title:7.0,toilet:6.0,avgSeed:5.05,streak:'L1',need:'Hold the 2-1 cushion while the scoring catches up.'},
    {team:'Rise of the Pleasure Machines',manager:'Christopher',playoff:70.0,bye:8.0,title:8.0,toilet:7.0,avgSeed:5.20,streak:'W1',need:'Convert elite scoring into wins before the standings harden.'},
    {team:'SVDBaller',manager:'Harry',playoff:64.0,bye:5.0,title:8.0,toilet:9.0,avgSeed:5.75,streak:'L2',need:'Stop the slide; the roster still grades better than the record.'},
    {team:'Bogota Booger Boys',manager:'Andrew',playoff:55.0,bye:2.0,title:4.0,toilet:13.0,avgSeed:6.35,streak:'L2',need:'A Week 4 win keeps the six-seed path clean.'},
    {team:'Jelq Me Jeantly',manager:'Owen',playoff:42.0,bye:1.0,title:2.0,toilet:18.0,avgSeed:7.05,streak:'W1',need:'Build on the first win and stabilize the roster.'},
    {team:'Premature Ejleculators',manager:'Matty B.',playoff:38.0,bye:0.5,title:1.5,toilet:21.0,avgSeed:7.35,streak:'L1',need:'The next win matters before press-conference risk compounds.'},
    {team:'The Great Communicator',manager:'Matt F.',playoff:8.0,bye:0.1,title:0.5,toilet:40.0,avgSeed:9.15,streak:'L3',need:'Week 4 is close to must-win territory at 0-3.'}
  ],
  stock:[
    {rank:1,team:'Wheat Hill Slow Blows',manager:'Tommy',price:96.4,signal:'STRONG BUY',record:'3-0',power:92.64,playoff:99.7,title:34.0,toilet:0.1},
    {rank:2,team:'MCFISH',manager:'Danny',price:85.9,signal:'STRONG BUY',record:'3-0',power:79.79,playoff:98.9,title:25.0,toilet:0.2},
    {rank:3,team:'SFPAL Junior 49ers',manager:'Tom',price:61.8,signal:'BUY',record:'2-1',power:75.70,playoff:83.0,title:10.0,toilet:3.0},
    {rank:4,team:'Rise of the Pleasure Machines',manager:'Christopher',price:56.6,signal:'BUY',record:'1-2',power:73.96,playoff:70.0,title:8.0,toilet:7.0},
    {rank:5,team:'The Breeder',manager:'Patrick',price:54.7,signal:'HOLD',record:'2-1',power:67.64,playoff:72.0,title:7.0,toilet:6.0},
    {rank:6,team:'SVDBaller',manager:'Harry',price:51.9,signal:'HOLD',record:'1-2',power:72.86,playoff:64.0,title:8.0,toilet:9.0},
    {rank:7,team:'Bogota Booger Boys',manager:'Andrew',price:44.1,signal:'SPECULATIVE',record:'1-2',power:68.22,playoff:55.0,title:4.0,toilet:13.0},
    {rank:8,team:'Jelq Me Jeantly',manager:'Owen',price:35.7,signal:'SPECULATIVE',record:'1-2',power:61.13,playoff:42.0,title:2.0,toilet:18.0},
    {rank:9,team:'Premature Ejleculators',manager:'Matty B.',price:32.8,signal:'SELL',record:'1-2',power:59.84,playoff:38.0,title:1.5,toilet:21.0},
    {rank:10,team:'The Great Communicator',manager:'Matt F.',price:13.4,signal:'STRONG SELL',record:'0-3',power:51.31,playoff:8.0,title:0.5,toilet:40.0}
  ],
  forecast:[
    {teamA:'SVDBaller',teamB:'The Great Communicator',meA:119.16,meB:94.75,yahooA:118.85,yahooB:94.66,mePick:'SVDBaller',yahooPick:'SVDBaller'},
    {teamA:'Wheat Hill Slow Blows',teamB:'The Breeder',meA:113.20,meB:104.86,yahooA:112.18,yahooB:105.84,mePick:'Wheat Hill Slow Blows',yahooPick:'Wheat Hill Slow Blows'},
    {teamA:'Rise of the Pleasure Machines',teamB:'Jelq Me Jeantly',meA:115.10,meB:107.99,yahooA:114.91,yahooB:108.58,mePick:'Rise of the Pleasure Machines',yahooPick:'Rise of the Pleasure Machines'},
    {teamA:'MCFISH',teamB:'SFPAL Junior 49ers',meA:113.63,meB:110.80,yahooA:113.79,yahooB:111.16,mePick:'MCFISH',yahooPick:'MCFISH'},
    {teamA:'Bogota Booger Boys',teamB:'Premature Ejleculators',meA:108.46,meB:104.53,yahooA:107.94,yahooB:104.57,mePick:'Bogota Booger Boys',yahooPick:'Bogota Booger Boys'}
  ]
};
Y.week4ModelSnapshot=S;
Y.currentModelSnapshot=S;
Y.week4PowerRankings=S.powerRankings;
Y.week4Odds=S.odds;
Y.week4StockMarket=S.stock;
Y.powerHistory=Y.powerHistory||{};
Y.powerHistory['3']=S.powerRankings.map(x=>({rank:x.rank,manager:x.manager,team:x.team,record:(Y.standings||[]).find(s=>s.team===x.team)?.record?.replace('-0','')||'',powerIndex:x.powerIndex,movement:x.movement}));
const pByTeam=Object.fromEntries(S.powerRankings.map(x=>[x.team,x]));
const oByTeam=Object.fromEntries(S.odds.map(x=>[x.team,x]));
if(Array.isArray(Y.teams))Y.teams=Y.teams.map(t=>{const p=pByTeam[t.team],o=oByTeam[t.team];return {...t,rank:p?.rank||t.rank,powerRank:p?.rank||t.powerRank,powerIndex:p?.powerIndex||t.powerIndex,playoffOdds:o?.playoff??t.playoffOdds,titleOdds:o?.title??t.titleOdds,pressRisk:o?.toilet??t.pressRisk};});
Y.predictionSnapshots=Y.predictionSnapshots||{};
Y.predictionSnapshots['4']={week:4,capturedAt:S.capturedAt,phase:'WEDNESDAY FORECAST',source:S.source+' + '+S.model,model:S.model,locked:true,matchups:S.forecast.map(x=>({teamA:x.teamA,teamB:x.teamB,meA:x.meA,meB:x.meB,yahooA:x.yahooA,yahooB:x.yahooB}))};
Y.weekly=Y.weekly||{};Y.weekly['4']=Y.weekly['4']||{};
Y.weekly['4'].matchups=S.forecast.map(x=>[x.teamA,x.teamB,String(x.meA),String(x.meB)]);
Y.weekly['4'].yahooProjections=S.forecast.map(x=>[x.teamA,x.teamB,x.yahooA,x.yahooB]);
Y.weekly['4'].modelLockedAt=S.capturedAt;
Y.weekly['4'].model=S.model;
})();