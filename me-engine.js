(function(){
  const D=window.LEAGUE_DATA||{};
  const Y=window.SEASON_2026||{};
  const H=window.MEFFL_HISTORY_GAMES||[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=v=>Number(String(v??0).replace(/,/g,''))||0;
  const parseRecord=r=>{const m=String(r||'0-0').match(/(\d+)\s*-\s*(\d+)/);return m?{w:+m[1],l:+m[2]}:{w:0,l:0}};
  const teams=()=>Y.teams||[];
  const managerByTeam=t=>teams().find(x=>x.team===t)?.manager||t;
  const teamByManager=m=>teams().find(x=>x.manager===m)?.team||m;
  const teamObj=t=>teams().find(x=>x.team===t)||{};
  const palette=['#7a0000','#8a3b12','#5d2844','#1f5c52','#4a4f91','#745a16','#345c7a','#6b3c22','#6e2959','#395b35'];
  const meta=t=>{
    const x=teamObj(t),i=Math.max(0,teams().findIndex(z=>z.team===t));
    const abbr=String(t||'').split(/\s+/).filter(Boolean).map(w=>w[0]).join('').slice(0,4).toUpperCase()||'ME';
    return {abbr,color:x.color||palette[i%palette.length],logo:x.logo||''};
  };
  function badge(t,size='md'){
    const m=meta(t);
    return m.logo?`<span class="team-mark ${size}" style="--team:${esc(m.color)}"><img src="${esc(m.logo)}" alt=""></span>`:`<span class="team-mark ${size}" style="--team:${esc(m.color)}">${esc(m.abbr)}</span>`;
  }
  function normalizedStandings(){
    const fallback=Object.fromEntries(teams().map(t=>[t.manager,t]));
    return (Y.standings||[]).map(s=>{
      const r=parseRecord(s.record),t=s.team||fallback[s.manager]?.team||teamByManager(s.manager);
      const w=s.w!=null?+s.w:r.w,l=s.l!=null?+s.l:r.l,pf=num(s.pf),pa=num(s.pa);
      return {...s,team:t,w,l,pf,pa,gp:w+l,pct:w/(w+l||1)};
    });
  }
  const preseasonMap=()=>{
    const model=Object.fromEntries((Y.modelOdds||[]).map(x=>[x.team,x]));
    const ranks=teams().map(t=>t.rank||10),loR=Math.min(...ranks),hiR=Math.max(...ranks);
    const wins=(Y.modelOdds||[]).map(x=>num(x.projWins)),loW=Math.min(...wins,4),hiW=Math.max(...wins,9);
    let out={};
    for(const t of teams()){
      const m=model[t.team];
      const rankScore=1-((num(t.rank)-loR)/(hiR-loR||1));
      const winScore=m?((num(m.projWins)-loW)/(hiW-loW||1)):rankScore;
      out[t.team]=clamp(.25+.55*(.55*rankScore+.45*winScore),.18,.85);
    }
    return out;
  };
  const PRE=preseasonMap();
  function currentStandings(){
    return normalizedStandings().sort((a,b)=>b.w-a.w||b.pf-a.pf||((PRE[b.team]||0)-(PRE[a.team]||0))||String(a.manager).localeCompare(String(b.manager))).map((x,i)=>({...x,seed:i+1}));
  }
  function schedule2026(){
    const out={};
    for(let w=1;w<=14;w++) out[String(w)]=(Y.weekly?.[String(w)]?.matchups||[]).map(m=>[m[0],m[1]]);
    return out;
  }
  function realResults(){return (Y.results||[]).filter(x=>x&&String(x.status||'').toUpperCase()!=='DEMO');}
  function allGames(){
    const old=H.map(g=>({...g,managerA:g.winner,managerB:g.loser,teamA:teamByManager(g.winner),teamB:teamByManager(g.loser),scoreA:g.scoreA??null,scoreB:g.scoreB??null}));
    const cur=realResults().map(x=>{
      const teamA=x.teamA||x.home,teamB=x.teamB||x.away,managerA=x.managerA||managerByTeam(teamA),managerB=x.managerB||managerByTeam(teamB),scoreA=Number(x.scoreA??x.homeScore),scoreB=Number(x.scoreB??x.awayScore),aWon=scoreA>scoreB;
      // Normalize every archived game to winner/loser order. Historical games already use
      // managerA/scoreA as the winner, so doing the same for live seasons keeps records,
      // career PF/PA, streaks and H2H calculations consistent regardless of scoring era.
      return {year:Number(x.year)||Number(Y.season)||2026,week:x.week??null,round:x.round||`Week ${x.week||''}`,stage:x.stage||'Regular Season',managerA:aWon?managerA:managerB,managerB:aWon?managerB:managerA,teamA:aWon?teamA:teamB,teamB:aWon?teamB:teamA,scoreA:aWon?scoreA:scoreB,scoreB:aWon?scoreB:scoreA,winner:aWon?managerA:managerB,loser:aWon?managerB:managerA};
    });
    return [...old,...cur];
  }
  const gameWinner=g=>g.winner||(num(g.scoreA)>num(g.scoreB)?g.managerA:g.managerB);
  function meetings(ma,mb){return allGames().filter(g=>(g.managerA===ma&&g.managerB===mb)||(g.managerA===mb&&g.managerB===ma)).sort((a,b)=>b.year-a.year||((b.week??99)-(a.week??99)));}
  function series(ma,mb){
    let w=0,l=0,postW=0,postL=0,regW=0,regL=0;
    for(const g of meetings(ma,mb)){
      const win=gameWinner(g)===ma;
      win?w++:l++;
      if(g.stage==='Regular Season') win?regW++:regL++; else win?postW++:postL++;
    }
    return {w,l,postW,postL,regW,regL,total:w+l};
  }
  function previousLine(g,ma){
    if(!g)return 'No verified meeting in the current archive.';
    const opp=g.managerA===ma?g.managerB:g.managerA,win=gameWinner(g)===ma;
    const scored=Number.isFinite(g.scoreA)&&Number.isFinite(g.scoreB);
    if(scored){const mine=g.managerA===ma?g.scoreA:g.scoreB,theirs=g.managerA===ma?g.scoreB:g.scoreA;return `${g.year} ${g.round}: ${ma} ${mine.toFixed(2)}–${theirs.toFixed(2)} ${opp}`;}
    return `${g.year} ${g.round}: ${win?ma:opp} beat ${win?opp:ma}`;
  }
  function matchupHistory(teamA,teamB){
    const ma=managerByTeam(teamA),mb=managerByTeam(teamB),s=series(ma,mb),ms=meetings(ma,mb),prev=ms[0];
    let biggest=null;
    for(const g of ms){if(Number.isFinite(g.scoreA)&&Number.isFinite(g.scoreB)){const d=Math.abs(g.scoreA-g.scoreB);if(!biggest||d>biggest.diff)biggest={g,diff:d};}}
    let streak='—';
    if(ms.length){const who=gameWinner(ms[0]);let n=0;for(const g of ms){if(gameWinner(g)===who)n++;else break}streak=`${who} W${n}`;}
    let rivalry='Fresh beef';
    if(s.total>=6&&Math.abs(s.w-s.l)<=2)rivalry='Real rivalry'; else if(s.total>=4)rivalry='Plenty of receipts'; else if(s.total>=2)rivalry='History building';
    let biggestText='Exact margin not in the verified archive yet';
    if(biggest){const g=biggest.g;biggestText=`${g.year} ${g.round} · ${gameWinner(g)} by ${biggest.diff.toFixed(2)}`;}
    return {ma,mb,...s,previous:previousLine(prev,ma),biggest:biggestText,streak,rivalry};
  }
  function rosterStrengthScores(){
    const out={};
    for(const m of (Y.liveMatchupProjections||[])){
      const a=m.teamA||m.home,b=m.teamB||m.away,pa=num(m.projA??m.projectedA),pb=num(m.projB??m.projectedB);
      if(a&&pa>0)out[a]=pa;if(b&&pb>0)out[b]=pb;
    }
    const vals=Object.values(out).filter(v=>v>0),hi=vals.length?Math.max(...vals):0;
    const normed={};for(const [t,v] of Object.entries(out))normed[t]=hi>0?clamp(v/hi,.65,1):0.7;
    return normed;
  }
  function recentFormScores(){
    const out={};
    const gs=realResults().filter(g=>(g.stage||'Regular Season')==='Regular Season').sort((a,b)=>(a.week||0)-(b.week||0));
    const raw={};
    for(const t of teams()){
      const mine=gs.filter(g=>[g.teamA||g.home,g.teamB||g.away].includes(t.team)).slice(-3);
      if(!mine.length)continue;let wins=0,pf=0;
      for(const g of mine){const a=(g.teamA||g.home)===t.team,sa=num(a?(g.scoreA??g.homeScore):(g.scoreB??g.awayScore)),sb=num(a?(g.scoreB??g.awayScore):(g.scoreA??g.homeScore));pf+=sa;if(sa>sb)wins++;}
      raw[t.team]={winPct:wins/mine.length,ppg:pf/mine.length};
    }
    const max=Math.max(1,...Object.values(raw).map(x=>x.ppg));for(const [t,x] of Object.entries(raw))out[t]=.6*x.winPct+.4*(x.ppg/max);
    return out;
  }
  function strengthRows(){
    const st=currentStandings(),maxPF=Math.max(1,...st.map(x=>x.pf||0)),roster=rosterStrengthScores(),recent=recentFormScores();
    return st.map(x=>{
      const pre=PRE[x.team]??.5,record=x.gp?x.pct:.5,scoring=x.gp?(x.pf/maxPF):.5;
      const rosterScore=roster[x.team]??pre,recentScore=recent[x.team]??record,liveWeight=clamp(x.gp/7,0,.74);
      const live=record*.48+scoring*.32+rosterScore*.12+recentScore*.08;
      const strength=pre*(1-liveWeight)+live*liveWeight;
      return {...x,preseasonScore:pre,recordScore:record,scoringScore:scoring,rosterScore,recentScore,liveWeight,strength,powerIndex:100*strength};
    });
  }
  function winProb(a,b){const rows=strengthRows(),by=Object.fromEntries(rows.map(x=>[x.team,x.strength]));const sa=by[a]??PRE[a]??.5,sb=by[b]??PRE[b]??.5;return clamp(1/(1+Math.exp(-(sa-sb)*2.6)),.18,.82);}
  function powerMetrics(){
    let rows=strengthRows().sort((a,b)=>b.powerIndex-a.powerIndex);
    return rows.map((x,i)=>({...x,powerRank:i+1}));
  }
  function streaks(){
    const out=Object.fromEntries(teams().map(t=>[t.manager,'—']));
    const gs=realResults().filter(g=>(g.stage||'Regular Season')==='Regular Season').sort((a,b)=>(a.week||0)-(b.week||0));
    for(const t of teams()){
      const mine=gs.filter(g=>[g.managerA||managerByTeam(g.teamA||g.home),g.managerB||managerByTeam(g.teamB||g.away)].includes(t.manager));
      let type=null,n=0;
      for(let i=mine.length-1;i>=0;i--){const g=mine[i],a=(g.managerA||managerByTeam(g.teamA||g.home))===t.manager,s1=num(a?(g.scoreA??g.homeScore):(g.scoreB??g.awayScore)),s2=num(a?(g.scoreB??g.awayScore):(g.scoreA??g.homeScore)),z=s1>s2?'W':'L';if(type===null){type=z;n=1}else if(type===z)n++;else break;}
      if(type)out[t.manager]=type+n;
    }
    return out;
  }
  function remainingSOS(team){
    const done=new Set(realResults().filter(x=>(x.stage||'Regular Season')==='Regular Season').map(x=>`${x.week}|${[x.teamA||x.home,x.teamB||x.away].sort().join('|')}`));
    const rank=Object.fromEntries(powerMetrics().map(x=>[x.team,x.powerRank]));
    const rem=[];
    for(let w=1;w<=14;w++)for(const [a,b] of schedule2026()[String(w)]||[])if((a===team||b===team)&&!done.has(`${w}|${[a,b].sort().join('|')}`))rem.push(a===team?b:a);
    return rem.length?rem.reduce((s,o)=>s+(rank[o]||10),0)/rem.length:null;
  }
  function rng(seed=20260901){let x=seed|0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%1000000)/1000000};}
  let SIMCACHE=null;
  function simulate(n=30000){
    if(SIMCACHE)return SIMCACHE;
    const rand=rng(),st=currentStandings(),all=st.map(x=>x.team),base=Object.fromEntries(st.map(x=>[x.team,{w:x.w,l:x.l,pf:x.pf,pa:x.pa}]));
    const done=new Set(realResults().filter(x=>(x.stage||'Regular Season')==='Regular Season').map(x=>`${x.week}|${[x.teamA||x.home,x.teamB||x.away].sort().join('|')}`));
    const rem=[];for(let w=1;w<=14;w++)for(const [a,b] of schedule2026()[String(w)]||[])if(!done.has(`${w}|${[a,b].sort().join('|')}`))rem.push([a,b]);
    const out=Object.fromEntries(all.map(t=>[t,{playoff:0,bye:0,title:0,press:0,seedSum:0,seeds:Array(11).fill(0)}]));
    const game=(a,b)=>rand()<winProb(a,b)?a:b;
    for(let z=0;z<n;z++){
      const rec=Object.fromEntries(all.map(t=>[t,{...base[t]}]));
      for(const [a,b] of rem){const winner=game(a,b),loser=winner===a?b:a;rec[winner].w++;rec[loser].l++;const sa=88+56*(PRE[a]??.5)+34*(rand()-.5),sb=88+56*(PRE[b]??.5)+34*(rand()-.5);rec[a].pf+=sa;rec[b].pf+=sb;rec[a].pa+=sb;rec[b].pa+=sa;}
      const seeds=[...all].sort((a,b)=>rec[b].w-rec[a].w||rec[b].pf-rec[a].pf||a.localeCompare(b));
      seeds.forEach((t,i)=>{const q=out[t];q.seedSum+=i+1;q.seeds[i+1]++;if(i<6)q.playoff++;if(i<2)q.bye++;});
      const s=i=>seeds[i-1],q36=game(s(3),s(6)),q45=game(s(4),s(5)),sf1=game(s(1),q45),sf2=game(s(2),q36),champ=game(sf1,sf2);out[champ].title++;
      const c710=game(s(7),s(10)),c89=game(s(8),s(9)),l1=c710===s(7)?s(10):s(7),l2=c89===s(8)?s(9):s(8),ninthWinner=game(l1,l2),press=ninthWinner===l1?l2:l1;out[press].press++;
    }
    SIMCACHE=all.map(t=>{const q=out[t];let cum=0,lo=1,hi=10;for(let i=1;i<=10;i++){cum+=q.seeds[i];if(cum/n>=.1){lo=i;break}}cum=0;for(let i=1;i<=10;i++){cum+=q.seeds[i];if(cum/n>=.9){hi=i;break}}return {team:t,manager:managerByTeam(t),playoff:+(100*q.playoff/n).toFixed(1),bye:+(100*q.bye/n).toFixed(1),title:+(100*q.title/n).toFixed(1),press:+(100*q.press/n).toFixed(1),avgSeed:+(q.seedSum/n).toFixed(2),seedLow:lo,seedHigh:hi};});
    return SIMCACHE;
  }
  function clinchInfo(team){
    const st=currentStandings(),me=st.find(x=>x.team===team),sixth=st[5],seventh=st[6];if(!me)return{};const games=14,rem=Math.max(0,games-me.gp),magic=Math.max(0,games+1-me.w-(seventh?.l||0)),elim=Math.max(0,games+1-(sixth?.w||0)-me.l);return {remaining:rem,playoffMagic:magic<=rem?magic:null,elimination:elim<=rem?elim:null};
  }
  function projectedField(sim=simulate()){return [...sim].sort((a,b)=>a.avgSeed-b.avgSeed);}
  function likelyOpponent(team,sim=simulate()){
    const f=projectedField(sim),idx=f.findIndex(x=>x.team===team)+1;if(idx<1)return '—';
    if(idx===1)return 'Bye → projected 4/5 winner';if(idx===2)return 'Bye → projected 3/6 winner';if(idx===3)return `Projected vs ${f[5]?.team||'seed 6'}`;if(idx===4)return `Projected vs ${f[4]?.team||'seed 5'}`;if(idx===5)return `Projected vs ${f[3]?.team||'seed 4'}`;if(idx===6)return `Projected vs ${f[2]?.team||'seed 3'}`;return 'Consolation / press-conference field';
  }
  function teamNeed(team,row){const me=currentStandings().find(x=>x.team===team);if(!me)return'';const rem=14-me.gp;if(rem===0)return me.seed<=6?(me.seed<=2?'First-round bye secured.':'Championship bracket secured.'):'The microphones are still in play.';if(row.playoff>=80)return 'Protect the playoff spot and push for a top-two bye.';if(row.playoff>=55)return 'Stay above the cut; points-for tiebreaks matter.';if(row.playoff>=30)return 'Needs wins and help around the six-seed line.';return 'Needs a run before the bracket race gets away.';}
  function implications(a,b){const st=currentStandings(),ga=st.find(x=>x.team===a)?.gp||0,gb=st.find(x=>x.team===b)?.gp||0,gp=Math.max(ga,gb);if(gp<5)return 'Early leverage: build the record and points-for cushion before the standings tighten.';if(gp<11)return 'This result can swing projected seed ranges and the pressure around the six-seed cut.';return 'Every result now hits playoff qualification, bye equity and press-conference risk directly.';}
  function demoBoard(week=1){
    const d=Y.weekly?.[String(week)]||{},ms=d.matchups||[];
    if(Number(week)!==1)return {week,mode:'DEMO',matchups:[]};
    const statuses=['LIVE','LIVE','UPCOMING','LIVE','FINAL'];
    return {week:1,mode:'DEMO',matchups:ms.map((m,i)=>{const a=m[0],b=m[1],pa=num(m[2])||Math.round((95+45*(PRE[a]||.5))*100)/100,pb=num(m[3])||Math.round((95+45*(PRE[b]||.5))*100)/100;let sa=pa,sb=pb;if(statuses[i]==='LIVE'){sa=+(pa*(.42+.08*i)).toFixed(2);sb=+(pb*(.45+.05*i)).toFixed(2);}if(statuses[i]==='FINAL'){sa=+(pa+3.4).toFixed(2);sb=+(pb-6.2).toFixed(2);}return {teamA:a,teamB:b,scoreA:statuses[i]==='UPCOMING'?null:sa,scoreB:statuses[i]==='UPCOMING'?null:sb,projectionA:pa,projectionB:pb,status:statuses[i],clock:statuses[i]==='LIVE'?(i===0?'Sun 2nd':'Sun 3rd'):statuses[i]==='FINAL'?'Final':'Thu 5:20 PM'};})};
  }
  function renderScoreboard(week=1,compact=false){
    const board=(Y.liveScoring&&Number(Y.liveScoring.week)===Number(week))?Y.liveScoring:demoBoard(week),ms=board.matchups||[];
    if(!ms.length)return `<div class="empty-state"><b>Live scoring opens when this week has matchups.</b></div>`;
    const cards=ms.map(m=>{const a=m.teamA||m.home,b=m.teamB||m.away,sa=m.scoreA??m.homeScore,sb=m.scoreB??m.awayScore,pa=num(m.projectionA||m.projA),pb=num(m.projectionB||m.projB),status=String(m.status||'UPCOMING').toUpperCase(),live=status==='LIVE',final=status==='FINAL',upcoming=!live&&!final,probA=live&&sa!=null&&sb!=null?clamp(50+(num(sa)-num(sb))*1.8+(pa-pb)*.35,7,93):100*winProb(a,b),fav=probA>=50?a:b,upset=live&&((probA>=62&&num(sa)<num(sb))||(probA<=38&&num(sa)>num(sb))),close=live&&Math.abs(num(sa)-num(sb))<8;return `<article class="score-card ${live?'live':final?'final':'upcoming'} ${close?'close':''} ${upset?'upset':''}"><div class="score-top"><span class="score-status">${esc(status)}</span>${close?'<span class="score-flag">CLOSE</span>':''}${upset?'<span class="score-flag upsetflag">UPSET WATCH</span>':''}</div><div class="score-team ${final&&num(sa)>num(sb)?'winner':''}">${badge(a,'sm')}<div><b>${esc(a)}</b><small>${esc(managerByTeam(a))}</small></div><strong>${sa==null?(pa?pa.toFixed(2)+'<small>PROJ</small>':'—'):num(sa).toFixed(2)}</strong></div><div class="score-team ${final&&num(sb)>num(sa)?'winner':''}">${badge(b,'sm')}<div><b>${esc(b)}</b><small>${esc(managerByTeam(b))}</small></div><strong>${sb==null?(pb?pb.toFixed(2)+'<small>PROJ</small>':'—'):num(sb).toFixed(2)}</strong></div><div class="win-meter"><span style="width:${probA.toFixed(1)}%"></span></div><div class="score-detail"><span>${esc(m.clock||'')}</span><b>${esc(fav)} ${Math.round(Math.max(probA,100-probA))}%</b></div></article>`;}).join('');
    return `<div class="score-grid ${compact?'compact':''}">${cards}</div>${String(board.mode||'').toUpperCase()==='DEMO'?'<div class="demo-note"><b>Week 1 preview mode.</b> Scores and game states are placeholders for the live-scoring interface and do not affect standings, odds, records or H2H.</div>':''}`;
  }
  function renderMatchupCard(a,b,week){
    const h=matchupHistory(a,b),p=100*winProb(a,b),fav=p>=50?a:b,favPct=Math.round(Math.max(p,100-p));
    return `<article class="matchup-pro"><div class="matchup-pro-head"><span>WEEK ${esc(week)}</span><span class="rivalry-tag">${esc(h.rivalry)}</span></div><div class="matchup-pro-teams"><div>${badge(a)}<b>${esc(a)}</b><small>${esc(h.ma)}</small><strong>${Math.round(p)}%</strong></div><div class="matchup-vs">VS</div><div>${badge(b)}<b>${esc(b)}</b><small>${esc(h.mb)}</small><strong>${Math.round(100-p)}%</strong></div></div><div class="upset-meter"><span style="width:${p.toFixed(1)}%"></span></div><div class="matchup-history-grid"><div><small>VERIFIED H2H</small><b>${esc(h.ma)} ${h.w}-${h.l} ${esc(h.mb)}</b></div><div><small>PREVIOUS MEETING</small><b>${esc(h.previous)}</b></div><div><small>LARGEST VERIFIED WIN</small><b>${esc(h.biggest)}</b></div><div><small>CURRENT SERIES STREAK</small><b>${esc(h.streak)}</b></div></div><div class="scenario-line"><b>${esc(fav)} ${favPct}% favorite.</b> ${esc(implications(a,b))}</div></article>`;
  }
  function officialRegularSeason(){const st=currentStandings();return st.length===10&&st.every(x=>x.gp>=14);}
  function seededField(){if(officialRegularSeason())return currentStandings().map(x=>({team:x.team,manager:x.manager,avgSeed:x.seed,seedLow:x.seed,seedHigh:x.seed}));return projectedField();}
  function postseasonBracket(week=15){
    const f=seededField(),s=i=>f[i-1]?.team||`Seed ${i}`,label=officialRegularSeason()?'OFFICIAL SEEDS':'PROJECTED FIELD';
    const title=`<div class="bracket-grid"><div class="bracket-col"><h3>Week 15 · Quarterfinals</h3><div class="bye-box">#1 ${esc(s(1))} — Bye</div><div class="bye-box">#2 ${esc(s(2))} — Bye</div><div class="bracket-game"><span>#3 ${esc(s(3))}</span><b>VS</b><span>#6 ${esc(s(6))}</span></div><div class="bracket-game"><span>#4 ${esc(s(4))}</span><b>VS</b><span>#5 ${esc(s(5))}</span></div></div><div class="bracket-col"><h3>Week 16 · Semifinals</h3><div class="bracket-game"><span>#1 ${esc(s(1))}</span><b>VS</b><span>4/5 winner</span></div><div class="bracket-game"><span>#2 ${esc(s(2))}</span><b>VS</b><span>3/6 winner</span></div></div><div class="bracket-col"><h3>Week 17 · Championship</h3><div class="bracket-game final"><span>Semifinal winner</span><b>VS</b><span>Semifinal winner</span></div></div></div>`;
    const toilet=`<div class="toilet-wrap"><p class="eyebrow">THE OTHER BRACKET</p><h3>Press-conference path</h3><p>The loser of the 9th-place game gets the microphone.</p><div class="bracket-grid"><div class="bracket-col"><h3>Week 15</h3><div class="bracket-game"><span>#7 ${esc(s(7))}</span><b>VS</b><span>#10 ${esc(s(10))}</span></div><div class="bracket-game"><span>#8 ${esc(s(8))}</span><b>VS</b><span>#9 ${esc(s(9))}</span></div></div><div class="bracket-col"><h3>Week 16–17</h3><div class="bracket-game final"><span>Loser of 7/10</span><b>VS</b><span>Loser of 8/9</span></div><div class="small">Lose again and the questions begin.</div></div><div class="bracket-col"><h3>${label}</h3><p class="small">Once all 14 regular-season games are final, projected seeds become official.</p></div></div></div>`;
    return `<div class="notice"><b>${label}</b> · Week ${esc(week)} postseason view</div>${title}${toilet}`;
  }
  function renderWarRoomIntel(){
    const sim=simulate(),streak=streaks(),pow=Object.fromEntries(powerMetrics().map(x=>[x.team,x])),rows=[...sim].sort((a,b)=>a.avgSeed-b.avgSeed);
    return `<div class="war-grid">${rows.map(r=>{const c=clinchInfo(r.team),sos=remainingSOS(r.team),p=pow[r.team]||{};const chips=[`Playoffs ${r.playoff}%`,`Bye ${r.bye}%`,`Title ${r.title}%`,`Press ${r.press}%`,`Seed ${r.seedLow}–${r.seedHigh}`,`SOS ${sos==null?'—':sos.toFixed(1)}`,`Streak ${streak[r.manager]||'—'}`];if(c.playoffMagic!=null)chips.push(`Magic ${c.playoffMagic}`);if(c.elimination!=null)chips.push(`Elim ${c.elimination}`);return `<article class="war-card">${badge(r.team)}<div><p class="eyebrow dark">#${p.powerRank||'—'} POWER · ${esc(r.manager)}</p><h3>${esc(r.team)}</h3><p>${esc(teamNeed(r.team,r))}</p><div class="war-chips">${chips.map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="scenario-line"><b>Likely path:</b> ${esc(likelyOpponent(r.team,sim))}</div></div></article>`;}).join('')}</div>`;
  }
  function playoffAppearances(){
    const good=new Set(['Quarterfinal','Semifinal','Final','3rd','3rd Place','5th','5th Place']);const by={};
    for(const g of H){if(!good.has(g.round))continue;for(const m of [g.winner,g.loser]){by[m]??=new Set();by[m].add(g.year);}}
    return Object.fromEntries(Object.entries(by).map(([m,s])=>[m,s.size]));
  }
  function leaderboardRows(){
    const app=playoffAppearances(),st=Object.fromEntries(currentStandings().map(x=>[x.manager,x]));
    const finals=realResults().filter(g=>/^(final|championship)$/i.test(String(g.round||''))),titleWinner=finals.length?gameWinner(finals[finals.length-1]):null;
    const official=officialRegularSeason(),seeds=Object.fromEntries(currentStandings().map(x=>[x.manager,x.seed]));
    const porcelainApps={},porcelainTitles={};
    for(const g of allGames().filter(g=>/9th\s*Place|Toilet/i.test(String(g.round||'')))){
      if(g.managerA)porcelainApps[g.managerA]=(porcelainApps[g.managerA]||0)+1;
      if(g.managerB)porcelainApps[g.managerB]=(porcelainApps[g.managerB]||0)+1;
      if(g.loser)porcelainTitles[g.loser]=(porcelainTitles[g.loser]||0)+1;
    }
    return (D.records||[]).map(r=>{const [bw,bl]=String(r.record).split('-').map(Number),live=st[r.manager]||{w:0,l:0,pf:0};const w=(bw||0)+live.w,l=(bl||0)+live.l,pfNum=num(r.pf)+live.pf,titles=(r.titles||0)+(titleWinner===r.manager?1:0),appearances=(app[r.manager]||0)+(official&&seeds[r.manager]<=6?1:0),toiletCount=porcelainTitles[r.manager]||0;return {...r,w,l,recordLive:`${w}-${l}`,pfNum,pfLive:pfNum.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),titles,appearances,toilets:toiletCount,porcelainAppearances:porcelainApps[r.manager]||0};});
  }
  function renderLeaderboards(){
    const active=new Set(teams().map(t=>t.manager)),rows=leaderboardRows().filter(x=>active.has(x.manager));
    const board=(title,arr,val)=>`<div class="card"><p class="eyebrow dark">${esc(title)}</p>${arr.map((x,i)=>`<div class="leader-line"><span>${i+1}</span><b>${esc(x.manager)}</b><strong>${esc(val(x))}</strong></div>`).join('')}</div>`;
    const label=(n,one,many)=>`${n} ${n===1?one:many}`;
    return `<div class="leaderboard-grid">${board('CAREER WINS',[...rows].sort((a,b)=>b.w-a.w||b.pfNum-a.pfNum||a.manager.localeCompare(b.manager)),x=>x.w)}${board('CAREER POINTS',[...rows].sort((a,b)=>b.pfNum-a.pfNum||b.w-a.w||a.manager.localeCompare(b.manager)),x=>x.pfLive)}${board('POSTSEASON',[...rows].sort((a,b)=>b.titles-a.titles||b.appearances-a.appearances||a.manager.localeCompare(b.manager)),x=>`${label(x.titles,'title','titles')} · ${label(x.appearances,'appearance','appearances')}`)}${board('PORCELAIN',[...rows].sort((a,b)=>b.toilets-a.toilets||b.porcelainAppearances-a.porcelainAppearances||a.manager.localeCompare(b.manager)),x=>`${label(x.toilets,'title','titles')} · ${label(x.porcelainAppearances,'appearance','appearances')}`)}</div>`;
  }
  function recordWatch(){
    const out=(Y.recordBook||[]).map(r=>({record:r[0],holder:r[1],number:r[2],receipt:r[3]}));
    const reg=allGames().filter(g=>(g.stage||'Regular Season')==='Regular Season'&&Number.isFinite(Number(g.scoreA))&&Number.isFinite(Number(g.scoreB))).sort((a,b)=>(Number(a.year)-Number(b.year))||((Number(a.week)||0)-(Number(b.week)||0)));
    if(!reg.length)return out;
    const bySeason={};
    for(const g of reg){for(const m of [g.managerA,g.managerB]){if(!m)continue;const k=`${g.year}|${m}`,r=bySeason[k]??={year:Number(g.year),manager:m,w:0,l:0,pf:0,gp:0};const won=g.winner===m;r.w+=won?1:0;r.l+=won?0:1;r.pf+=won?num(g.scoreA):num(g.scoreB);r.gp++;bySeason[k]=r;}}
    const seasons=Object.values(bySeason),complete=seasons.filter(x=>x.gp>=14);
    const finals=allGames().filter(g=>g.stage==='Postseason'&&/^(Final|Championship)$/i.test(String(g.round||''))),titleCounts={};for(const g of finals)if(g.winner)titleCounts[g.winner]=(titleCounts[g.winner]||0)+1;
    const managers=[...new Set(reg.flatMap(g=>[g.managerA,g.managerB]).filter(Boolean))],streaks={};
    for(const m of managers){let cw=0,cl=0,mw=0,ml=0;for(const g of reg.filter(g=>g.managerA===m||g.managerB===m)){if(g.winner===m){cw++;cl=0;mw=Math.max(mw,cw)}else{cl++;cw=0;ml=Math.max(ml,cl)}}streaks[m]={mw,ml};}
    const replace=(name,data)=>{const i=out.findIndex(r=>r.record===name);if(i>=0&&data)out[i]={record:name,...data};};
    const maxTitles=Math.max(0,...Object.values(titleCounts));if(maxTitles){const holders=Object.entries(titleCounts).filter(([,v])=>v===maxTitles).map(([m])=>m).sort();replace('Most titles',{holder:holders.join(' / '),number:String(maxTitles),receipt:`Through ${Math.max(...finals.map(g=>Number(g.year)||0))}.`});}
    if(complete.length){
      const best=[...complete].sort((a,b)=>b.w-a.w||a.l-b.l||b.pf-a.pf)[0],bestT=complete.filter(x=>x.w===best.w&&x.l===best.l);replace('Best single-season record',{holder:bestT.map(x=>x.manager).sort().join(' / '),number:`${best.w}-${best.l}`,receipt:bestT.map(x=>`${x.manager} ${x.year}`).join('; ')+'.'});
      const hi=[...complete].sort((a,b)=>b.pf-a.pf)[0];replace('Highest single-season PF',{holder:hi.manager,number:hi.pf.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),receipt:`${hi.year}.`});
      const lo=[...complete].sort((a,b)=>a.pf-b.pf)[0];replace('Lowest single-season PF',{holder:lo.manager,number:lo.pf.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),receipt:`${lo.year}.`});
    }
    const win=[...Object.entries(streaks)].sort((a,b)=>b[1].mw-a[1].mw||a[0].localeCompare(b[0]))[0],loss=[...Object.entries(streaks)].sort((a,b)=>b[1].ml-a[1].ml||a[0].localeCompare(b[0]))[0];
    if(win)replace('Longest regular-season win streak',{holder:win[0],number:String(win[1].mw),receipt:'All seasons combined.'});
    if(loss)replace('Longest regular-season losing streak',{holder:loss[0],number:String(loss[1].ml),receipt:'All seasons combined.'});
    return out;
  }
  window.MEFFL_ENGINE={esc,badge,meta,managerByTeam,teamByManager,currentStandings,schedule2026,realResults,allGames,series,meetings,matchupHistory,powerMetrics,streaks,remainingSOS,simulate,clinchInfo,likelyOpponent,teamNeed,implications,renderScoreboard,renderMatchupCard,postseasonBracket,renderWarRoomIntel,leaderboardRows,renderLeaderboards,recordWatch,officialRegularSeason};
})();
