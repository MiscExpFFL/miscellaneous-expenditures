(function(){
  const isMakers=!!window.MAKERS_DATA;
  const D=isMakers?(window.MAKERS_DATA||{}):(window.LEAGUE_DATA||{});
  const Y=isMakers?(window.MAKERS_2026||{}):(window.SEASON_2026||{});
  const E=isMakers?window.MAKERS_ENGINE:window.MEFFL_ENGINE;
  const IMPORTS=isMakers?(window.MAKERS_WEEKLY_IMPORTS||[]):(window.MEFFL_WEEKLY_IMPORTS||[]);
  const NS=isMakers?'MAKERS_ANALYTICS':'MEFFL_ANALYTICS';
  const shell=isMakers?'wrap':'shell';
  const leagueName=isMakers?'The Makers':'Miscellaneous Expenditures';
  const seasonStart=isMakers?2022:2023;
  const currentYear=Number(Y.season)||2026;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const pct=v=>Number.isFinite(v)?`${(v*100).toFixed(1)}%`:'—';
  const fmt=v=>Number.isFinite(v)?Number(v).toFixed(2):'—';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
  const sd=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/a.length)};
  const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const weekLink=w=>isMakers?`week.html?week=${w}`:`week.html?week=${w}`;
  const franchiseLink=m=>`franchise.html?manager=${encodeURIComponent(m)}`;
  const hasFranchise=m=>isMakers?(D.franchises||[]).some(x=>x.manager===m):activeNames.includes(m);
  const managerCell=m=>hasFranchise(m)?`<a href="${franchiseLink(m)}"><b>${e(m)}</b></a>`:`<b>${e(m)}</b>`;

  const misexpLegacyKeepers=[
    [2024,'Jeremy','Lamar Jackson',2],[2024,'Jeremy','Breece Hall',4],[2024,'Owen','Isiah Pacheco',5],[2024,'Matt F.','Alvin Kamara',6],[2024,'Owen','Dak Prescott',6],[2024,'Christopher','Rachaad White',7],[2024,'Christopher','Mike Evans',8],[2024,'Harry','Hollywood Brown',8],[2024,'Matty B.','Brock Purdy',8],[2024,'Tommy','Jonathan Taylor',8],[2024,'Harry','Rashee Rice',9],[2024,'Matt F.','Zay Flowers',11],[2024,'Tommy','Anthony Richardson Sr.',11],
    [2025,'Owen','Malik Nabers',3],[2025,'Matt F.','Alvin Kamara',4],[2025,'Christopher','Mike Evans',6],[2025,'Tommy','Jonathan Taylor',6],[2025,'Tommy','Brian Thomas Jr.',7],[2025,'Harry','Chase Brown',9],[2025,'Matt F.','Zay Flowers',9],[2025,'Harry','Ladd McConkey',10],[2025,'Christopher','Brock Bowers',11]
  ].map(x=>({year:x[0],manager:x[1],player:x[2],round:x[3]}));

  function activeManagers(){
    const rows=isMakers?(Y.draftRankings||[]):(Y.teams||[]);
    return rows.map(x=>({manager:x.manager,team:x.team,rank:Number(x.rank)||99})).filter(x=>x.manager&&x.team);
  }
  const active=activeManagers();
  const activeNames=active.map(x=>x.manager);
  function teamByManager(m){return E?.teamByManager?E.teamByManager(m):(active.find(x=>x.manager===m)?.team||m)}
  function managerByTeam(t){return E?.managerByTeam?E.managerByTeam(t):(active.find(x=>x.team===t)?.manager||t)}
  function allGames(){return E?.allGames?E.allGames():[]}
  function scored(g){return num(g?.scoreA)!=null&&num(g?.scoreB)!=null}
  function regGames(){return allGames().filter(g=>String(g.stage||'Regular Season')==='Regular Season'&&scored(g)&&Number(g.week)>=1&&Number(g.week)<=14)}
  function postGames(){return allGames().filter(g=>String(g.stage||'')!=='Regular Season'&&scored(g))}
  function gameWinner(g){const a=num(g.scoreA),b=num(g.scoreB);if(a===b)return null;return a>b?g.managerA:g.managerB}
  function gameLoser(g){const w=gameWinner(g);if(!w)return null;return w===g.managerA?g.managerB:g.managerA}

  function luckRows(){
    const games=regGames();
    const map={};
    const ensure=m=>map[m]||(map[m]={manager:m,games:0,actualW:0,actualL:0,ties:0,xw:0,apW:0,apL:0,apT:0,pf:0,pa:0,closeW:0,closeL:0,closeT:0,luckyWins:0,badBeatLosses:0,scores:[],byWeek:[]});
    const groups={};
    for(const g of games){const key=`${g.year}|${g.week}`;(groups[key]??=[]).push(g)}
    for(const [key,weekGames] of Object.entries(groups)){
      const entries=[];
      for(const g of weekGames){entries.push({manager:g.managerA,score:num(g.scoreA),opp:g.managerB,oppScore:num(g.scoreB),game:g});entries.push({manager:g.managerB,score:num(g.scoreB),opp:g.managerA,oppScore:num(g.scoreA),game:g})}
      if(entries.length<2)continue;
      for(const x of entries){
        const r=ensure(x.manager),others=entries.filter(z=>z.manager!==x.manager),aw=others.filter(z=>x.score>z.score).length,at=others.filter(z=>x.score===z.score).length,al=others.length-aw-at,weeklyX=(aw+.5*at)/(others.length||1);
        r.games++;r.pf+=x.score;r.pa+=x.oppScore;r.scores.push(x.score);r.xw+=weeklyX;r.apW+=aw;r.apL+=al;r.apT+=at;
        const won=x.score>x.oppScore,lost=x.score<x.oppScore;if(won)r.actualW++;else if(lost)r.actualL++;else r.ties++;
        if(Math.abs(x.score-x.oppScore)<10){if(won)r.closeW++;else if(lost)r.closeL++;else r.closeT++}
        if(won&&weeklyX<=.33)r.luckyWins++;
        if(lost&&weeklyX>=.67)r.badBeatLosses++;
        const [year,week]=key.split('|').map(Number);r.byWeek.push({year,week,score:x.score,opp:x.opp,oppScore:x.oppScore,xw:weeklyX,won,lost,allPlayWins:aw,allPlayLosses:al});
      }
    }
    return Object.values(map).map(r=>({...r,luck:(r.actualW+.5*r.ties)-r.xw,apPct:(r.apW+.5*r.apT)/(r.apW+r.apL+r.apT||1),ppg:r.pf/(r.games||1),papg:r.pa/(r.games||1),closePct:(r.closeW+r.closeL+r.closeT)?(r.closeW+.5*r.closeT)/(r.closeW+r.closeL+r.closeT):.5,volatility:sd(r.scores)}));
  }

  function postseasonRows(){
    const map={};const ensure=m=>map[m]||(map[m]={manager:m,w:0,l:0,titles:0,finals:0,games:0});
    for(const g of postGames()){
      const a=ensure(g.managerA),b=ensure(g.managerB),w=gameWinner(g),l=gameLoser(g);a.games++;b.games++;if(w){ensure(w).w++;ensure(l).l++}
      if(String(g.round||'').toLowerCase()==='final'&&w){ensure(w).titles++;ensure(w).finals++;ensure(l).finals++}
    }
    return Object.values(map).map(r=>({...r,pct:r.w/(r.w+r.l||1)}));
  }

  function keeperRows(){
    if(isMakers)return (D.keeperHistory||[]).map(x=>({...x,round:Number(String(x.round||'').replace(/\D/g,''))||null}));
    const cur=(Y.keepers2026||[]).map(x=>({year:2026,manager:x.manager,player:x.player,round:Number(x.round)||null}));
    return [...misexpLegacyKeepers,...cur];
  }

  function moveTotals(){
    const out={};
    if(isMakers){for(const r of D.records||[])out[r.manager]=Number(r.moves)||0;for(const m of activeNames)out[m]=(out[m]||0)+Number(Y.transactionCounts2026?.[m]||0)}
    else {for(const r of Y.transactionLeaderboard||[])out[r[0]]=Number(r[5]??((+r[1]||0)+(+r[2]||0)+(+r[3]||0)+(+r[4]||0)))||0}
    return out;
  }

  function h2hFor(m){
    const rows={};
    for(const g of regGames()){
      if(g.managerA!==m&&g.managerB!==m)continue;
      const opp=g.managerA===m?g.managerB:g.managerA,won=gameWinner(g)===m;
      rows[opp]??={opp,w:0,l:0,games:0};rows[opp].games++;won?rows[opp].w++:rows[opp].l++;
    }
    const a=Object.values(rows);if(!a.length)return {best:null,worst:null};
    const eligible=a.filter(x=>x.games>=3),pool=eligible.length?eligible:a;
    const best=[...pool].sort((x,y)=>(y.w-y.l)-(x.w-x.l)||y.w-x.w||y.games-x.games)[0];
    const worst=[...pool].sort((x,y)=>(x.w-x.l)-(y.w-y.l)||y.l-x.l||y.games-x.games)[0];
    return {best,worst};
  }

  function percentileMap(values,higher=true){
    const finite=values.filter(x=>Number.isFinite(x.value));
    const sorted=[...finite].sort((a,b)=>higher?a.value-b.value:b.value-a.value),out={};
    sorted.forEach((x,i)=>out[x.manager]=sorted.length===1?50:Math.round(10+90*i/(sorted.length-1)));
    return out;
  }

  function dnaRows(){
    const luck=luckRows(),post=postseasonRows(),keepers=keeperRows(),moves=moveTotals();
    const raw=active.map(a=>{
      const l=luck.find(x=>x.manager===a.manager)||{games:0,ppg:0,closePct:.5,volatility:0,luck:0},p=post.find(x=>x.manager===a.manager)||{w:0,l:0,titles:0,finals:0,pct:0},archiveYears=new Set((l.byWeek||[]).map(x=>x.year)),seasons=Math.max(1,archiveYears.size+(archiveYears.has(currentYear)?0:1)),keeperCount=keepers.filter(k=>k.manager===a.manager).length;
      return {...a,l,p,seasons,keeperCount,moves:Number(moves[a.manager]||0),movesPerSeason:Number(moves[a.manager]||0)/seasons,keeperPerSeason:keeperCount/seasons,postScore:p.titles*20+p.finals*7+p.w*2+p.pct*8};
    });
    const scoreP=percentileMap(raw.map(x=>({manager:x.manager,value:x.l.ppg}))),clutchP=percentileMap(raw.map(x=>({manager:x.manager,value:x.l.closePct}))),churnP=percentileMap(raw.map(x=>({manager:x.manager,value:x.movesPerSeason}))),keeperP=percentileMap(raw.map(x=>({manager:x.manager,value:x.keeperPerSeason}))),postP=percentileMap(raw.map(x=>({manager:x.manager,value:x.postScore}))),volP=percentileMap(raw.map(x=>({manager:x.manager,value:x.l.volatility})));
    return raw.map(x=>{
      const axes={scoring:scoreP[x.manager]||10,clutch:clutchP[x.manager]||10,churn:churnP[x.manager]||10,keeper:keeperP[x.manager]||10,postseason:postP[x.manager]||10,volatility:volP[x.manager]||10};
      let label='Balanced Operator';
      if(x.p.titles>=2)label='Banner Collector';
      else if(axes.postseason>=85&&x.p.titles)label='December Operator';
      else if(axes.churn>=90)label='Waiver Day Trader';
      else if(axes.churn<=20&&x.movesPerSeason<12)label='Set-It-and-Let-It-Ride';
      else if(axes.scoring>=85&&x.l.luck<-1)label='Points-For Martyr';
      else if(axes.clutch>=85&&(x.l.closeW+x.l.closeL)>=5)label='One-Score Assassin';
      else if(axes.keeper>=85&&x.keeperCount>=3)label='Keeper Merchant';
      else if(axes.volatility>=90)label='Chaos Engine';
      else if(x.l.luck>1.5)label='Schedule Whisperer';
      else {const mx=Object.entries(axes).sort((a,b)=>b[1]-a[1])[0];if((mx?.[1]||0)>=70)label={scoring:'Scoreboard Bully',clutch:'Late-Game Operator',churn:'Roster Tinkerer',keeper:'Keeper Builder',postseason:'Bracket Problem',volatility:'Boom/Bust Merchant'}[mx[0]]||label}
      const hh=h2hFor(x.manager);
      return {...x,axes,label,h2h:hh};
    });
  }

  function managerDNA(manager){return dnaRows().find(x=>x.manager===manager)}

  function txEvents(){
    const seen=new Map(),snaps=[...IMPORTS].sort((a,b)=>String(a.capturedAt||'').localeCompare(String(b.capturedAt||'')));
    for(const s of snaps){for(const tx of s?.data?.transactions||[]){const manager=tx.manager||managerByTeam(tx.team),key=[tx.type,manager,tx.team,tx.add,tx.drop,tx.faab,tx.time||tx.date||tx.description].map(x=>String(x??'')).join('|');if(!seen.has(key))seen.set(key,{...tx,manager,firstTargetWeek:Number(s.targetWeek)||Number(s.completedWeek)+1||1,firstCompletedWeek:Number(s.completedWeek)||0,capturedAt:s.capturedAt})}}
    return [...seen.values()];
  }
  function rosterPoint(p){for(const k of ['points','recent']){const n=num(p?.[k]);if(n!=null)return n}return null}
  function postMnfSnapshots(){return [...IMPORTS].filter(s=>/post[-_ ]?mnf/i.test(String(s.mode||''))&&Number(s.completedWeek)>=1).sort((a,b)=>Number(a.completedWeek)-Number(b.completedWeek)||String(a.capturedAt||'').localeCompare(String(b.capturedAt||'')))}

  function acquisitionRows(){
    const events=txEvents(),adds=events.filter(x=>x.add),drops=events.filter(x=>x.drop),snaps=postMnfSnapshots();
    return adds.map(a=>{
      const start=Number(a.firstTargetWeek)||1;const laterDrop=drops.filter(d=>d.manager===a.manager&&String(d.drop).toLowerCase()===String(a.add).toLowerCase()&&Number(d.firstTargetWeek)>=start).sort((x,y)=>x.firstTargetWeek-y.firstTargetWeek)[0];const stop=laterDrop?Number(laterDrop.firstTargetWeek):Infinity;
      let impact=0,weeks=0,weekScores=[];
      for(const s of snaps){const w=Number(s.completedWeek);if(w<start||w>=stop)continue;const roster=(s.data?.rosters||[]).find(r=>r.manager===a.manager||r.team===a.team),p=roster?.players?.find(p=>String(p.name).toLowerCase()===String(a.add).toLowerCase()),pts=rosterPoint(p);if(pts!=null){impact+=pts;weeks++;weekScores.push({week:w,points:pts})}}
      return {...a,startWeek:start,dropWeek:Number.isFinite(stop)?stop:null,impact,weeksScored:weeks,weekScores,faab:num(a.faab)??0};
    });
  }

  function frontOfficeRows(){
    const acq=acquisitionRows(),events=txEvents(),moves=Y.transactionCounts2026||{},managers=active.map(x=>x.manager);
    const rows=managers.map(m=>{
      const mine=acq.filter(x=>x.manager===m),impact=mine.reduce((s,x)=>s+x.impact,0),faab=mine.reduce((s,x)=>s+x.faab,0),freePts=mine.filter(x=>!x.faab).reduce((s,x)=>s+x.impact,0),scoredAdds=mine.filter(x=>x.weeksScored>0),best=[...mine].sort((a,b)=>b.impact-a.impact)[0]||null;
      const fallbackMove=isMakers?Number(moves[m]||0):Number((Y.transactionLeaderboard||[]).find(r=>r[0]===m)?.[4]||0);const eventCount=events.filter(x=>x.manager===m).length,moveCount=Math.max(fallbackMove,eventCount);
      return {manager:m,team:teamByManager(m),moves:moveCount,faab,impact,freePts,adds:mine.length,scoredAdds:scoredAdds.length,bestAdd:best,costPerPoint:impact>0?faab/impact:null,score:impact-.35*faab+.25*freePts+(best?.impact||0)*.12};
    });
    const graded=rows.filter(x=>x.scoredAdds>0).sort((a,b)=>b.score-a.score),gradeMap={};graded.forEach((x,i)=>{const p=graded.length===1?1:1-i/(graded.length-1);gradeMap[x.manager]=p>=.9?'A+':p>=.78?'A':p>=.63?'B+':p>=.48?'B':p>=.33?'C+':p>=.18?'C':'D'});
    return rows.map(x=>({...x,grade:gradeMap[x.manager]||'INC'}));
  }

  function resultForManagerWeek(manager,week){return allGames().find(g=>Number(g.year)===currentYear&&Number(g.week)===Number(week)&&String(g.stage||'Regular Season')==='Regular Season'&&(g.managerA===manager||g.managerB===manager)&&scored(g))}
  function officialScore(g,m){return g.managerA===m?num(g.scoreA):num(g.scoreB)}
  function opponentScore(g,m){return g.managerA===m?num(g.scoreB):num(g.scoreA)}
  function opponentManager(g,m){return g.managerA===m?g.managerB:g.managerA}
  function isBenchSlot(slot){return /^(BN|IR|IL|NA|RES)$/i.test(String(slot||'').trim())}
  function normalizePos(p){let z=String(p?.pos||p?.position||'').toUpperCase();if(z==='D/ST'||z==='DST')z='DEF';return z}
  function optimizeRoster(players){
    const usable=players.map((p,i)=>({...p,_i:i,_pts:rosterPoint(p),_pos:normalizePos(p)})).filter(p=>p._pts!=null&&!/^(IR|IL|NA|RES)$/i.test(String(p.slot||'')));
    const slots=['QB','RB','RB','WR','WR','TE','FLEX','K','DEF'];let best=-Infinity,bestIdx=[];
    const eligible=(p,s)=>s==='FLEX'?['RB','WR','TE'].includes(p._pos):p._pos===s;
    function go(si,used,total,picks){if(si===slots.length){if(total>best){best=total;bestIdx=[...picks]}return}const s=slots[si];for(const p of usable){if(used.has(p._i)||!eligible(p,s))continue;used.add(p._i);picks.push(p._i);go(si+1,used,total+p._pts,picks);picks.pop();used.delete(p._i)}}
    go(0,new Set(),0,[]);return Number.isFinite(best)?{score:best,indices:new Set(bestIdx)}:null;
  }
  function lineupAutopsies(){
    const out=[];for(const s of postMnfSnapshots()){
      const week=Number(s.completedWeek);for(const roster of s.data?.rosters||[]){const m=roster.manager||managerByTeam(roster.team);if(!m)continue;const g=resultForManagerWeek(m,week);if(!g)continue;const players=roster.players||[],relevant=players.filter(p=>!/^(IR|IL|NA|RES)$/i.test(String(p.slot||''))),allScored=relevant.length>=9&&relevant.every(p=>rosterPoint(p)!=null);if(!allScored)continue;const starters=relevant.filter(p=>!isBenchSlot(p.slot)),starterSum=starters.reduce((s,p)=>s+(rosterPoint(p)||0),0),official=officialScore(g,m),oppScore=opponentScore(g,m);if(official==null||Math.abs(starterSum-official)>1.5)continue;const opt=optimizeRoster(players);if(!opt||opt.score+0.01<official)continue;const left=Math.max(0,opt.score-official),eff=opt.score?official/opt.score:1,bench=[...relevant].filter(p=>isBenchSlot(p.slot)).map(p=>({...p,_pts:rosterPoint(p)})).sort((a,b)=>b._pts-a._pts),topBench=bench[0]||null,lost=official<oppScore,costGame=lost&&opt.score>oppScore;
        out.push({week,manager:m,team:roster.team||teamByManager(m),official,optimal:opt.score,left,eff,opponent:opponentManager(g,m),oppScore,topBench,costGame});
      }}return out;
  }
  function lineupManagerRows(){const a=lineupAutopsies(),map={};for(const m of activeNames)map[m]={manager:m,weeks:0,official:0,optimal:0,left:0,costGames:0,biggest:null};for(const x of a){const r=map[x.manager]|| (map[x.manager]={manager:x.manager,weeks:0,official:0,optimal:0,left:0,costGames:0,biggest:null});r.weeks++;r.official+=x.official;r.optimal+=x.optimal;r.left+=x.left;r.costGames+=x.costGame?1:0;if(!r.biggest||x.left>r.biggest.left)r.biggest=x}return Object.values(map).map(r=>({...r,eff:r.optimal?r.official/r.optimal:null}))}

  function managersMentioned(text,weekObj,awardName){
    const found=new Set(),raw=String(text||''),lower=raw.toLowerCase();
    const names=[...active].sort((a,b)=>b.manager.length-a.manager.length);
    for(const x of names){const m=x.manager.toLowerCase(),t=x.team.toLowerCase();if(lower.includes(t)||new RegExp(`(^|[^a-z])${m.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z]|$)`,'i').test(raw))found.add(x.manager)}
    if(/game of the week/i.test(String(awardName||''))&&weekObj?.gameOfWeek){const sides=String(weekObj.gameOfWeek).split(/\s+vs\s+/i);for(const side of sides){const exact=active.find(x=>x.team.toLowerCase()===side.trim().toLowerCase());if(exact)found.add(exact.manager)}}
    if(!found.size&&/\bvs\b/i.test(raw)&&weekObj?.matchups){for(const pair of weekObj.matchups){const teams=pair.slice(0,2);for(const t of teams){const tokens=String(t).toLowerCase().split(/\s+/).filter(w=>w.length>3);if(tokens.some(tok=>lower.includes(tok))){const m=managerByTeam(t);if(activeNames.includes(m))found.add(m)}}}}
    return [...found];
  }
  function awardData(){
    const leader=Object.fromEntries(active.map(x=>[x.manager,{manager:x.manager,team:x.team,awards:0,gotw:0,watch:0,weeks:new Set()}])),archive=[];
    const weekly=Y.weekly||{};for(const [wk,obj] of Object.entries(weekly)){const week=Number(wk);if(!obj||!obj.headline)continue;const awards=(obj.awards||[]).map(a=>Array.isArray(a)?{name:a[0],recipient:a[1],detail:a[2]||''}:a).filter(x=>x?.name);for(const a of awards){const ms=managersMentioned(a.recipient,obj,a.name);for(const m of ms){if(!leader[m])continue;leader[m].awards++;leader[m].weeks.add(week)}archive.push({week,...a,managers:ms})}
      if(obj.gameOfWeek){const ms=managersMentioned(obj.gameOfWeek,obj,'Game of the Week');for(const m of ms)if(leader[m])leader[m].gotw++}
      const watch=obj.shameWatch||obj.toiletWatch||'';for(const m of managersMentioned(watch,obj,''))if(leader[m])leader[m].watch++;
    }
    return {leader:Object.values(leader).map(x=>({...x,weeks:x.weeks.size})).sort((a,b)=>b.awards-a.awards||b.gotw-a.gotw||a.manager.localeCompare(b.manager)),archive:archive.sort((a,b)=>b.week-a.week)};
  }

  function transactionsByWeek(){const map={};for(const x of txEvents()){const w=Number(x.firstTargetWeek)||1;(map[w]??=[]).push(x)}return map}
  function pulseWeeks(){
    const games=allGames().filter(g=>Number(g.year)===currentYear&&String(g.stage||'Regular Season')==='Regular Season'&&scored(g)),groups={};for(const g of games)(groups[Number(g.week)]??=[]).push(g);const tx=transactionsByWeek();return Object.entries(groups).map(([w,gs])=>{const scores=gs.flatMap(g=>[{m:g.managerA,team:g.teamA||teamByManager(g.managerA),s:num(g.scoreA)},{m:g.managerB,team:g.teamB||teamByManager(g.managerB),s:num(g.scoreB)}]),high=[...scores].sort((a,b)=>b.s-a.s)[0],low=[...scores].sort((a,b)=>a.s-b.s)[0],close=[...gs].sort((a,b)=>Math.abs(num(a.scoreA)-num(a.scoreB))-Math.abs(num(b.scoreA)-num(b.scoreB)))[0],blow=[...gs].sort((a,b)=>Math.abs(num(b.scoreA)-num(b.scoreB))-Math.abs(num(a.scoreA)-num(a.scoreB)))[0];return {week:Number(w),games:gs.length,avg:mean(scores.map(x=>x.s)),high,low,close,blow,transactions:(tx[Number(w)]||[]).length,headline:Y.weekly?.[w]?.headline||'',gotw:Y.weekly?.[w]?.gameOfWeek||''}}).sort((a,b)=>a.week-b.week)
  }
  function gameLabel(g){if(!g)return '—';const a=num(g.scoreA),b=num(g.scoreB),wa=a>=b?g.managerA:g.managerB,wb=a>=b?g.managerB:g.managerA,sa=Math.max(a,b),sb=Math.min(a,b);return `${wa} ${sa.toFixed(2)}–${sb.toFixed(2)} ${wb}`}
  function timelineEvents(){
    const out=[{sort:0,label:'PRESEASON',title:'Draft board locked',body:`The ${currentYear} roster construction and preseason rankings became the baseline for every live model that follows.`,kind:'draft'}];
    const first=IMPORTS[0];if(first)out.push({sort:.2,label:'DATA PIPELINE',title:'Collector connected',body:`Validated league snapshot received · ${Number(first.validation?.counts?.rosters||0)} rosters · ${Number(first.validation?.counts?.upcoming||0)} upcoming matchups.`,kind:'data'});
    if(Y.weekly?.['1']?.headline)out.push({sort:.4,label:'WEEK 1',title:Y.weekly['1'].headline,body:Y.weekly['1'].gameOfWeek?`Game of the Week: ${Y.weekly['1'].gameOfWeek}.`:'The opening preview is published.',kind:'editorial'});
    for(const p of pulseWeeks())out.push({sort:p.week,label:`WEEK ${p.week} FINAL`,title:`${p.high.m} set the weekly pace at ${p.high.s.toFixed(2)}`,body:`League average ${p.avg.toFixed(2)} · closest game ${gameLabel(p.close)} · biggest margin ${Math.abs(num(p.blow.scoreA)-num(p.blow.scoreB)).toFixed(2)}.`,kind:'final'});
    for(const s of IMPORTS.filter(x=>/post[-_ ]?waivers/i.test(String(x.mode||''))))out.push({sort:(Number(s.targetWeek)||1)-.1,label:`WEEK ${Number(s.targetWeek)||1}`,title:'Waivers cleared',body:`The post-waiver roster and FAAB snapshot was locked for the week.`,kind:'waivers'});
    return out.sort((a,b)=>a.sort-b.sort);
  }

  function section(id,kicker,title,body,intro=''){return `<section class="section analytics-section" id="${e(id)}"><div class="${shell}"><div class="section-head"><div><div class="${isMakers?'kicker':'eyebrow dark'}">${e(kicker)}</div><h2>${e(title)}</h2></div>${intro?`<p class="section-intro">${e(intro)}</p>`:''}</div>${body}</div></section>`}
  function statCard(label,value,detail=''){return `<article class="analytics-stat"><span>${e(label)}</span><strong>${e(value)}</strong>${detail?`<small>${e(detail)}</small>`:''}</article>`}
  function table(headers,rows,cls=''){return `<div class="table-wrap analytics-table-wrap" tabindex="0"><table class="analytics-table ${cls}"><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">No data yet.</td></tr>`}</tbody></table></div>`}
  function axis(label,value){return `<div class="dna-axis"><div><span>${e(label)}</span><b>${e(value)}</b></div><div class="dna-track"><i style="width:${clamp(Number(value)||0,0,100)}%"></i></div></div>`}

  function renderLuck(){
    const rows=luckRows().filter(x=>x.games>0).sort((a,b)=>b.luck-a.luck||b.apPct-a.apPct),best=rows[0],worst=rows.at(-1),ap=[...rows].sort((a,b)=>b.apPct-a.apPct)[0],clutch=[...rows].filter(x=>x.closeW+x.closeL+x.closeT>=3).sort((a,b)=>b.closePct-a.closePct)[0];
    const body=`<div class="analytics-stat-grid">${statCard('Luckiest schedule',best?`${best.manager} +${best.luck.toFixed(2)} W`:'—','Actual wins minus all-play expected wins')}${statCard('Unluckiest schedule',worst?`${worst.manager} ${worst.luck.toFixed(2)} W`:'—','Negative means the schedule cost wins')}${statCard('Best all-play résumé',ap?`${ap.manager} · ${pct(ap.apPct)}`:'—','Every weekly score vs every other team')}${statCard('Close-game leader',clutch?`${clutch.manager} · ${clutch.closeW}-${clutch.closeL}`:'—','Games decided by fewer than 10')}</div>`+
      table(['Manager','GP','Actual W','Expected W','Luck Δ','All-Play','PF/G','PA/G','Close (<10)','Lucky W','Bad-beat L'],rows.map(r=>`<tr><td>${managerCell(r.manager)}</td><td>${r.games}</td><td>${r.actualW}</td><td>${r.xw.toFixed(2)}</td><td><b class="${r.luck>=0?'metric-good':'metric-bad'}">${r.luck>=0?'+':''}${r.luck.toFixed(2)}</b></td><td>${pct(r.apPct)}</td><td>${r.ppg.toFixed(2)}</td><td>${r.papg.toFixed(2)}</td><td>${r.closeW}-${r.closeL}${r.closeT?`-${r.closeT}`:''}</td><td>${r.luckyWins}</td><td>${r.badBeatLosses}</td></tr>`).join(''),'luck-table');
    return section('luck','LUCK & EFFICIENCY','Schedule luck, all-play truth and scoring context',body,`Regular-season games from ${seasonStart} forward. Expected wins are calculated from each week's all-play performance, not a projection model.`)
  }

  function renderFrontOffice(){
    const rows=frontOfficeRows().sort((a,b)=>(b.grade!=='INC')-(a.grade!=='INC')||b.score-a.score||b.moves-a.moves),luck=luckRows(),moves=moveTotals();
    const historical=active.map(a=>{const l=luck.find(x=>x.manager===a.manager),m=Number(moves[a.manager]||0);return {manager:a.manager,w:l?.actualW||0,moves:m,per100:m?100*(l?.actualW||0)/m:null}}).sort((a,b)=>(b.per100??-1)-(a.per100??-1));
    const scored=rows.filter(x=>x.scoredAdds>0),top=scored[0],bestAdd=[...rows].filter(x=>x.bestAdd?.weeksScored).sort((a,b)=>(b.bestAdd?.impact||0)-(a.bestAdd?.impact||0))[0],acqs=acquisitionRows().sort((a,b)=>b.startWeek-a.startWeek||b.impact-a.impact),worstBurn=[...acqs].filter(x=>x.faab>0&&x.weeksScored>0).sort((a,b)=>(a.impact/(a.faab||1))-(b.impact/(b.faab||1)))[0];
    const body=`<div class="analytics-stat-grid">${statCard('Front-office leader',top?`${top.manager} · ${top.grade}`:'Awaiting Week 1','Grades activate when acquired players produce scored weeks')}${statCard('Best acquisition',bestAdd?`${bestAdd.bestAdd.add} · ${bestAdd.bestAdd.impact.toFixed(2)} pts`:'Awaiting Week 1',bestAdd?`${bestAdd.manager} · from Week ${bestAdd.bestAdd.startWeek}`:'The acquisition tracker is already armed')}${statCard('Worst FAAB burn',worstBurn?`${worstBurn.add} · $${worstBurn.faab}`:'Not enough scored data',worstBurn?`${worstBurn.impact.toFixed(2)} points after acquisition`:'Activates after paid claims produce points')}${statCard('Moves logged',String(rows.reduce((s,x)=>s+x.moves,0)),'2026 deduplicated manager activity')}${statCard('FAAB tied to adds',`$${rows.reduce((s,x)=>s+x.faab,0).toFixed(0)}`,'Public completed spending only')}</div>`+
      table(['Manager','Grade','Moves','FAAB','Acquisition pts','Best add','Cost / pt'],rows.map(r=>`<tr><td><b>${e(r.manager)}</b><div class="table-sub">${e(r.team)}</div></td><td><span class="analytics-grade grade-${slug(r.grade)}">${e(r.grade)}</span></td><td>${r.moves}</td><td>$${r.faab.toFixed(0)}</td><td>${r.scoredAdds?r.impact.toFixed(2):'—'}</td><td>${r.bestAdd?.weeksScored?`<b>${e(r.bestAdd.add)}</b><div class="table-sub">${r.bestAdd.impact.toFixed(2)} pts</div>`:'—'}</td><td>${r.costPerPoint!=null&&r.scoredAdds?`$${r.costPerPoint.toFixed(2)}`:'—'}</td></tr>`).join(''),'front-office-table')+
      `<div class="analytics-subsection"><h3>Acquisition receipts</h3>${acqs.length?table(['Manager','Added','Start','FAAB','Scored weeks','Impact','Status'],acqs.map(x=>`<tr><td><b>${e(x.manager)}</b></td><td>${e(x.add)}</td><td>W${x.startWeek}</td><td>$${x.faab.toFixed(0)}</td><td>${x.weeksScored}</td><td>${x.weeksScored?x.impact.toFixed(2):'—'}</td><td>${x.weeksScored?'Tracking':'Awaiting points'}</td></tr>`).join('')):`<div class="analytics-empty compact"><b>No acquisition receipts yet.</b><p>The first completed add, waiver claim or trade acquisition will appear here automatically.</p></div>`}</div>`+
      `<div class="analytics-subsection"><h3>Historical activity efficiency</h3><p>Context only: regular-season wins per 100 career moves. This is not the transaction ROI grade.</p>${table(['Manager','Career moves','Regular-season wins','Wins / 100 moves'],historical.map(r=>`<tr><td><b>${e(r.manager)}</b></td><td>${r.moves}</td><td>${r.w}</td><td>${r.per100==null?'—':r.per100.toFixed(1)}</td></tr>`).join(''))}</div>`;
    return section('front-office','FRONT OFFICE','Transaction ROI & front-office grades',body,'Completed transactions are deduplicated across collector snapshots. Acquisition production starts counting only after the player is actually acquired.')
  }

  function renderLineups(){
    const aut=lineupAutopsies(),rows=lineupManagerRows().sort((a,b)=>(b.eff??-1)-(a.eff??-1)),valid=rows.filter(x=>x.weeks>0),best=valid[0],left=[...valid].sort((a,b)=>b.left-a.left)[0],flips=aut.filter(x=>x.costGame).sort((a,b)=>b.left-a.left),latest=Math.max(0,...aut.map(x=>x.week));
    const kpis=`<div class="analytics-stat-grid">${statCard('Best efficiency',best?`${best.manager} · ${pct(best.eff)}`:'Engine armed',best?`${best.weeks} validated week${best.weeks===1?'':'s'}`:'Waiting for completed-week player scoring')}${statCard('Most points left',left?`${left.manager} · ${left.left.toFixed(2)}`:'—','Season total vs optimal lineups')}${statCard('Decision losses',String(flips.length),'Losses where the optimal lineup would have won')}${statCard('Latest validated week',latest?`Week ${latest}`:'Not yet','Roster scoring must reconcile to the official matchup total')}</div>`;
    const empty=!valid.length?`<div class="analytics-empty"><b>The autopsy engine is live; there just is not a body yet.</b><p>After a POST-MNF snapshot contains completed-week player scores, the engine validates the captured starters against the official team total, calculates the best legal QB/RB/RB/WR/WR/TE/FLEX/K/DEF lineup, and records points left on the bench. If the captured roster does not reconcile to Yahoo's official total, the week is rejected instead of guessed.</p></div>`:'';
    const board=valid.length?table(['Manager','Weeks','Actual pts','Optimal pts','Efficiency','Left on bench','Games cost'],valid.map(r=>`<tr><td><b>${e(r.manager)}</b></td><td>${r.weeks}</td><td>${r.official.toFixed(2)}</td><td>${r.optimal.toFixed(2)}</td><td>${pct(r.eff)}</td><td>${r.left.toFixed(2)}</td><td>${r.costGames}</td></tr>`).join(''),'lineup-table'):'';
    const receipts=aut.length?`<div class="analytics-subsection"><h3>Weekly start/sit receipts</h3><div class="autopsy-grid">${[...aut].sort((a,b)=>b.week-a.week||b.left-a.left).slice(0,30).map(x=>`<article class="autopsy-card${x.costGame?' decision-loss':''}"><span>WEEK ${x.week}</span><h4>${e(x.manager)} · ${e(x.team)}</h4><div><b>${x.official.toFixed(2)}</b><small>actual</small><b>${x.optimal.toFixed(2)}</b><small>optimal</small></div><p>${x.left.toFixed(2)} points left${x.topBench?` · top bench: ${e(x.topBench.name)} ${Number(x.topBench._pts).toFixed(2)}`:''}</p>${x.costGame?`<strong>LINEUP DECISION COULD HAVE FLIPPED THE GAME</strong>`:''}</article>`).join('')}</div></div>`:'';
    return section('lineups','START / SIT AUTOPSY','Lineup decisions and optimal-score forensics',kpis+empty+board+receipts,'No historical optimal-lineup scores are invented. This section populates only from validated completed-week roster scoring captured by the weekly collector.')
  }

  function renderDNAGrid(){
    const rows=dnaRows().sort((a,b)=>a.rank-b.rank),cards=rows.map(x=>`<article class="dna-card"><div class="dna-head"><div><span>${e(x.manager)}</span><h3>${e(x.label)}</h3><small>${e(x.team)}</small></div><a href="${franchiseLink(x.manager)}">Full profile →</a></div><div class="dna-bars">${axis('Scoring',x.axes.scoring)}${axis('Clutch',x.axes.clutch)}${axis('Churn',x.axes.churn)}${axis('Keeper',x.axes.keeper)}${axis('Postseason',x.axes.postseason)}${axis('Volatility',x.axes.volatility)}</div><p><b>${x.l.closeW}-${x.l.closeL}</b> in games under 10 points · <b>${x.movesPerSeason.toFixed(1)}</b> moves/season · <b>${x.keeperCount}</b> verified keepers.</p></article>`).join('');
    return section('dna','MANAGER DNA','How every manager actually operates',`<div class="dna-grid">${cards}</div>`,'Percentile-style DNA bars are calculated against the current manager pool using scoring, close-game results, roster churn, verified keeper usage, postseason résumé and weekly scoring volatility.')
  }

  function renderPulse(){
    const pulse=pulseWeeks(),events=timelineEvents(),latest=pulse.at(-1),tx=txEvents();
    const kpis=`<div class="analytics-stat-grid">${statCard('Completed weeks',String(pulse.length),'2026 regular season')}${statCard('League transactions',String(tx.length),'Unique collector receipts')}${statCard('Current weekly headline',Y.weekly?.[String(Math.max(1,pulse.length+1))]?.headline||Y.weekly?.['1']?.headline||'Week 1','League Desk')}${statCard('Latest league average',latest?latest.avg.toFixed(2):'Preseason',latest?`Week ${latest.week}`:'First scores are next')}</div>`;
    const weekCards=pulse.length?`<div class="pulse-week-grid">${pulse.map(p=>`<article class="pulse-card"><span>WEEK ${p.week}</span><h3>${e(p.high.m)} · ${p.high.s.toFixed(2)}</h3><p>League avg <b>${p.avg.toFixed(2)}</b></p><dl><div><dt>Closest</dt><dd>${e(gameLabel(p.close))}</dd></div><div><dt>Biggest margin</dt><dd>${Math.abs(num(p.blow.scoreA)-num(p.blow.scoreB)).toFixed(2)}</dd></div><div><dt>Moves entering week</dt><dd>${p.transactions}</dd></div></dl></article>`).join('')}</div>`:`<div class="analytics-empty compact"><b>Week 1 is the first live pulse.</b><p>The timeline already has the draft, collector connection and opening preview; score-based pulse cards appear as soon as the first five finals are imported.</p></div>`;
    const timeline=`<div class="analytics-subsection"><h3>2026 season timeline</h3><div class="league-timeline">${events.map(x=>`<article class="timeline-item timeline-${e(x.kind)}"><div class="timeline-dot"></div><div><span>${e(x.label)}</span><h4>${e(x.title)}</h4><p>${e(x.body)}</p></div></article>`).join('')}</div></div>`;
    return section('pulse','LEAGUE PULSE','Season timeline & weekly pulse',kpis+weekCards+timeline,'A running season log built from the draft baseline, collector snapshots, weekly editorials and official completed games.')
  }

  function renderAwards(innerOnly=false){
    const a=awardData(),top=a.leader[0],gotw=[...a.leader].sort((x,y)=>y.gotw-x.gotw)[0],total=a.archive.length;
    const board=`<div class="analytics-stat-grid awards-stats">${statCard('Awards logged',String(total),'Published weekly awards')}${statCard('Awards leader',top&&top.awards?`${top.manager} · ${top.awards}`:'Week 1 board','Manager credits from named recipients')}${statCard('GOTW appearances',gotw&&gotw.gotw?`${gotw.manager} · ${gotw.gotw}`:'Week 1 board','Both managers receive an appearance')}${statCard('Published award weeks',String(new Set(a.archive.map(x=>x.week)).size),'Archive depth')}</div>`+
      table(['Manager','Awards','GOTW apps','Watch mentions','Award weeks'],a.leader.map(r=>`<tr><td><b>${e(r.manager)}</b><div class="table-sub">${e(r.team)}</div></td><td><b>${r.awards}</b></td><td>${r.gotw}</td><td>${r.watch}</td><td>${r.weeks}</td></tr>`).join(''),'awards-table')+
      `<div class="analytics-subsection"><h3>Weekly award archive</h3><div class="award-archive-grid">${a.archive.length?a.archive.map(x=>`<article class="award-receipt"><span>WEEK ${x.week}</span><h4>${e(x.name)}</h4><b>${e(x.recipient||'')}</b>${x.detail?`<p>${e(x.detail)}</p>`:''}</article>`).join(''):'<div class="analytics-empty compact">No weekly awards have been published yet.</div>'}</div></div>`;
    return innerOnly?board:section('awards','WEEKLY HARDWARE','Weekly Awards Leaderboard',board,'Awards accumulate automatically from each published weekly write-up. Game of the Week appearances are tracked separately from award credits.')
  }

  function renderManagerDNA(manager){
    const x=managerDNA(manager);if(!x)return '';
    const arch=!isMakers?(D.archetypes||[]).find(a=>a.manager===manager):null,hh=x.h2h;
    const rival=hh.best?`${hh.best.w}-${hh.best.l} vs ${hh.best.opp}`:'—',nem=hh.worst?`${hh.worst.w}-${hh.worst.l} vs ${hh.worst.opp}`:'—';
    return `<section class="section manager-dna-section"><div class="${shell}"><div class="section-head"><div><div class="${isMakers?'kicker':'eyebrow dark'}">MANAGER DNA</div><h2>${e(x.label)}</h2></div><p class="section-intro">Career tendencies calculated from the league archive.</p></div>${arch?`<div class="manager-dna-archetype"><span>LEAGUE ARCHETYPE</span><b>${e(arch.title)}</b></div>`:''}<div class="manager-dna-layout"><article class="dna-card featured"><div class="dna-bars">${axis('Scoring',x.axes.scoring)}${axis('Clutch',x.axes.clutch)}${axis('Churn',x.axes.churn)}${axis('Keeper',x.axes.keeper)}${axis('Postseason',x.axes.postseason)}${axis('Volatility',x.axes.volatility)}</div></article><div class="manager-dna-facts">${statCard('Close games',`${x.l.closeW}-${x.l.closeL}${x.l.closeT?`-${x.l.closeT}`:''}`,`${pct(x.l.closePct)} under 10 points`)}${statCard('Roster churn',`${x.movesPerSeason.toFixed(1)} / season`,`${x.moves} recorded moves`)}${statCard('Keeper usage',String(x.keeperCount),'Verified keeper seasons / assets')}${statCard('Postseason',`${x.p.w}-${x.p.l}`,`${x.p.titles} titles · ${x.p.finals} finals`)}${statCard('Best H2H edge',rival,'Regular season')}${statCard('Toughest matchup',nem,'Regular season')}</div></div><div class="manager-dna-copy"><p>${e(`${manager}'s scoring profile sits around the ${x.axes.scoring}th percentile of the current manager pool, while roster churn sits around the ${x.axes.churn}th. ${x.l.luck>=0?`Schedule results have run ${x.l.luck.toFixed(2)} wins above all-play expectation.`:`Schedule results have run ${Math.abs(x.l.luck).toFixed(2)} wins below all-play expectation.`}`)}</p></div></div></section>`;
  }

  function renderAwardsSection(){return `<section class="section alt weekly-awards-leaderboard"><div class="${shell}"><div class="section-head"><div><div class="${isMakers?'kicker':'eyebrow dark'}">SEASON LEADERBOARD</div><h2>Weekly Awards</h2></div><a class="${isMakers?'btn ghost darkghost':'button ghost'}" href="analytics.html#awards">Full analytics →</a></div>${renderAwards(true)}</div></section>`}

  function renderPage(){
    const hero=isMakers?`<section class="hero analytics-hero"><div class="${shell}"><div class="eyebrow">THE NUMBERS BEHIND THE GRUDGES</div><h1>League Analytics<br><em style="color:var(--gold);font-weight:400">Lab</em></h1><p>Luck, lineup decisions, front-office value, manager tendencies and the season pulse — built from the archive and weekly collector snapshots.</p></div></section>`:`<section class="hero analytics-hero"><div class="${shell}"><p class="eyebrow">THE FORENSICS LAB</p><h1>League<br><em style="color:var(--lime);font-weight:400">Analytics</em></h1><p class="lede">Luck, lineup decisions, front-office value, manager tendencies and the season pulse — with enough receipts to ruin several arguments.</p></div></section>`;
    const jump=`<section class="analytics-jump"><div class="${shell}"><nav aria-label="Analytics sections"><a href="#luck">Luck & Efficiency</a><a href="#front-office">Front Office</a><a href="#lineups">Lineup Autopsy</a><a href="#dna">Manager DNA</a><a href="#pulse">League Pulse</a><a href="#awards">Weekly Awards</a></nav></div></section>`;
    return hero+jump+renderLuck()+renderFrontOffice()+renderLineups()+renderDNAGrid()+renderPulse()+renderAwards();
  }

  window[NS]={renderPage,renderManagerDNA,renderAwardsSection,luckRows,frontOfficeRows,lineupAutopsies,dnaRows,pulseWeeks,awardData,transactionEvents:txEvents,acquisitionRows};
})();
