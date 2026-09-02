(function(){
  const Y=window.SEASON_2026;
  if(!Y) return;

  const imports=Array.isArray(window.MEFFL_WEEKLY_IMPORTS)&&window.MEFFL_WEEKLY_IMPORTS.length
    ? window.MEFFL_WEEKLY_IMPORTS
    : (window.MEFFL_WEEKLY_IMPORT?[window.MEFFL_WEEKLY_IMPORT]:[]);
  const valid=imports.filter(I=>I&&/^meffl-weekly-collector\//.test(String(I.schema||'')));
  if(!valid.length) return;

  const TEAM_MANAGER={
    'SVDBaller':'Harry',
    'Wheat Hill Slow Blows':'Tommy',
    'Rise of the Pleasure Machines':'Christopher',
    'SFPAL Junior 49ers':'Tom',
    'Bogota Booger Boys':'Andrew',
    'The Great Communicator':'Matt F.',
    'Premature Ejleculators':'Matty B.',
    'Jelq Me Jeantly':'Owen',
    'The Breeder':'Patrick',
    'MCFISH':'Danny'
  };
  const MANAGER_TEAM=Object.fromEntries(Object.entries(TEAM_MANAGER).map(([t,m])=>[m,t]));
  const num=v=>{const n=Number(String(v??'').replace(/[$,% ,]/g,''));return Number.isFinite(n)?n:null};
  const teamName=x=>x?.team||x?.name||x?.teamName||MANAGER_TEAM[x?.manager]||'';
  const managerName=x=>x?.manager||TEAM_MANAGER[teamName(x)]||'';
  const pairKey=(week,a,b)=>`${Number(week)||0}|${[a,b].sort().join('|')}`;

  Y.collectorSnapshots=[];

  function applyImport(I,isLatest){
    const data=I.data||{};
    Y.collectorSnapshots.push({
      mode:I.mode||'',capturedAt:I.capturedAt||'',completedWeek:Number(I.completedWeek)||0,
      targetWeek:Number(I.targetWeek)||1,validation:I.validation||{}
    });

    if(isLatest){
      Y.collectorStatus={
        active:true,schema:I.schema,mode:I.mode||'',capturedAt:I.capturedAt||'',
        completedWeek:Number(I.completedWeek)||0,targetWeek:Number(I.targetWeek)||Number(Y.week)||1,
        validation:I.validation||{},source:'Yahoo browser collector',snapshotCount:valid.length
      };
      if(I.capturedAt) Y.lastUpdated=I.capturedAt;
      if(Number(I.targetWeek)>=1) Y.week=Number(I.targetWeek);
      Y.weeklyCollectorDelta=I.delta||null;
    }

    if(Array.isArray(data.standings)&&data.standings.length){
      Y.standings=data.standings.map((s,i)=>{
        const team=teamName(s),manager=managerName(s),w=num(s.w),l=num(s.l),record=s.record||`${w??0}-${l??0}`;
        return {
          rank:num(s.rank)??i+1,manager,team,record,
          w:w??undefined,l:l??undefined,
          pf:(num(s.pf)??0).toFixed(2),pa:(num(s.pa)??0).toFixed(2),
          movement:s.movement||'—',streak:s.streak||'—'
        };
      }).filter(s=>s.team&&s.manager);
    }

    const finals=(data.matchups||[]).filter(m=>{
      const sa=num(m.scoreA),sb=num(m.scoreB);
      return sa!=null&&sb!=null&&(m.final===true||/final|closed|complete/i.test(String(m.status||''))||Number(m.week)<=Number(I.completedWeek||0));
    });
    if(finals.length){
      const existing=new Map((Y.results||[]).map(r=>[pairKey(r.week,r.teamA||r.home,r.teamB||r.away),r]));
      for(const m of finals){
        const a=teamName({team:m.teamA}),b=teamName({team:m.teamB});
        if(!a||!b) continue;
        existing.set(pairKey(m.week,a,b),{
          year:Number(Y.season)||2026,week:Number(m.week)||Number(I.completedWeek)||1,
          stage:'Regular Season',status:'FINAL',teamA:a,teamB:b,
          managerA:TEAM_MANAGER[a]||'',managerB:TEAM_MANAGER[b]||'',
          scoreA:num(m.scoreA),scoreB:num(m.scoreB),source:'Yahoo browser collector'
        });
      }
      Y.results=[...existing.values()].sort((a,b)=>(a.week||0)-(b.week||0));
    }

    const completed=Number(I.completedWeek)||0;
    if(completed&&Y.weekly?.[String(completed)]){
      const weekFinals=finals.filter(m=>Number(m.week)===completed);
      if(weekFinals.length){
        Y.weekly[String(completed)].results=weekFinals.map(m=>[m.teamA,m.teamB,String(m.scoreA),String(m.scoreB)]);
        Y.weekly[String(completed)].collectorUpdatedAt=I.capturedAt||'';
      }
    }

    const target=Number(I.targetWeek)||Number(Y.week)||1;
    const upcoming=(data.matchupProjections?.length?data.matchupProjections:data.matchups||[]).filter(m=>Number(m.week||target)===target);
    if(upcoming.length&&Y.weekly?.[String(target)]){
      const old=Y.weekly[String(target)].matchups||[];
      const byPair=new Map(upcoming.map(m=>[[m.teamA,m.teamB].sort().join('|'),m]));
      Y.weekly[String(target)].matchups=old.map(row=>{
        const m=byPair.get([row[0],row[1]].sort().join('|'));
        if(!m)return row;
        return [row[0],row[1],m.projA??m.scoreA??row[2]??'',m.projB??m.scoreB??row[3]??''];
      });
    }

    if(Array.isArray(data.rosters)&&data.rosters.length){
      Y.liveRosters=data.rosters.map(r=>({
        team:teamName(r),manager:managerName(r),players:Array.isArray(r.players)?r.players:[],capturedAt:I.capturedAt||''
      })).filter(r=>r.team);
    }
    if(Array.isArray(data.matchupProjections)&&data.matchupProjections.length)Y.liveMatchupProjections=data.matchupProjections;

    const oldWire=Y.waiverWire||{};
    const tx=(data.transactions||[]).map(x=>({
      type:x.type||'MOVE',manager:x.manager||TEAM_MANAGER[x.team]||'',team:x.team||MANAGER_TEAM[x.manager]||'',
      add:x.add||'',drop:x.drop||'',faab:num(x.faab),
      description:x.description||[x.add&&`Added ${x.add}`,x.drop&&`Dropped ${x.drop}`].filter(Boolean).join(' · ')||'Completed transaction',
      time:x.time||x.date||''
    }));
    const faab=(data.faab||[]).map((x,i)=>({
      priority:num(x.priority)??i+1,manager:x.manager||TEAM_MANAGER[x.team]||'',team:x.team||MANAGER_TEAM[x.manager]||'',
      spent:num(x.spent)??Math.max(0,100-(num(x.remaining)??100)),remaining:num(x.remaining)??100,claimsWon:num(x.claimsWon)??0
    }));
    const available=(data.availablePlayers||[]).map(p=>({
      name:p.name||'',position:p.position||p.pos||'',nflTeam:p.nflTeam||p.nfl||'',status:p.status||'FA',
      recent:p.recent||p.points||p.projected||'—',faabSuggestion:p.faabSuggestion||''
    })).filter(p=>p.name);
    if(tx.length||faab.length||available.length){
      Y.waiverWire={...oldWire,apiStatus:'Yahoo collector updated',lastUpdated:I.capturedAt||Y.lastUpdated,
        recentTransactions:tx.length?tx:(oldWire.recentTransactions||[]),
        faab:faab.length?faab:(oldWire.faab||[]),topAvailable:available.length?available:(oldWire.topAvailable||[])
      };
    }
  }

  valid.forEach((I,i)=>applyImport(I,i===valid.length-1));
})();
