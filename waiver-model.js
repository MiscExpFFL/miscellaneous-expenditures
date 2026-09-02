(function(){
  const WEEK1={
    'Jared Goff':16.2,'Jordan Love':15.7,'Malik Willis':14.6,'Baker Mayfield':16.1,'Tyler Shough':14.8,'Sam Darnold':15.1,'Daniel Jones':14.7,'C.J. Stroud':14.5,'Cam Ward':14.0,'Bryce Young':13.7,'Jacoby Brissett':12.9,'Fernando Mendoza':12.6,'Geno Smith':12.4,'Aaron Rodgers':12.2,'Michael Penix Jr.':13.4,
    'Woody Marks':5.2,'Tyler Allgeier':5.9,'Ray Davis':5.6,'Braelon Allen':3.7,'Emmett Johnson':5.0,'Isiah Pacheco':0.0,'Dylan Sampson':6.3,'Alvin Kamara':4.4,'Najee Harris':5.7,'Demond Claiborne':4.7,'Kaytron Allen':4.6,'Nicholas Singleton':4.5,'Kaleb Johnson':4.4,'Malik Davis':4.2,'George Holani':4.1,'Tyrone Tracy Jr.':6.6,'Kendre Miller':4.1,'Kimani Vidal':3.4,'James Conner':0.0,'Seth McGowan':3.8,'Sean Tucker':3.7,'Samaje Perine':3.6,'Jaydon Blue':3.9,'Justice Hill':4.8,'Adam Randall':0.0,
    'Josh Downs':9.0,'Michael Pittman Jr.':8.2,'Jalen Coker':7.7,'Romeo Doubs':7.4,'Jakobi Meyers':8.1,'Xavier Worthy':7.6,'Rashid Shaheed':7.1,'Khalil Shakir':7.7,'Denzel Boston':6.8,'Keenan Allen':6.9,'Adonai Mitchell':6.5,'Jalen McMillan':6.4,'Dontayvion Wicks':5.9,'Pat Bryant':5.6,'Ryan Flournoy':5.2,'Caleb Douglas':4.8,'Kayshon Boutte':5.1,"Ja'Kobi Lane":4.6,'Cyrus Allen':4.4,'Travis Hunter':6.7,'Jalen Nailor':5.5,"Tre' Harris":5.4,'Jaylin Noel':5.1,'Devaughn Vele':4.7,'Jerry Jeudy':6.8,
    'Mark Andrews':8.4,'Dalton Schultz':6.9,'Chig Okonkwo':6.2,'Terrance Ferguson':6.6,'Hunter Henry':6.4,'Brenton Strange':7.0,'AJ Barner':6.2,'Greg Dulcich':5.1,'Kenyon Sadiq':5.7,'T.J. Hockenson':6.2,'Oronde Gadsden':3.9,'Gunnar Helm':5.4,'Colby Parkinson':6.4,'Darren Waller':6.2,'Charlie Kolar':3.2,
    'Will Reichard':7.2,'Cairo Santos':7.3,'Evan McPherson':7.7,'Wil Lutz':6.9,'Trey Smack':7.1,'Chase McLaughlin':7.6,'Chris Boswell':7.6,'Harrison Butker':6.7,'Charlie Smyth':5.9,'Andy Borregales':6.4,
    'Patriots':6.4,'Ravens':6.2,'Cowboys':6.2,'Lions':6.6,'Packers':5.8,'Chiefs':5.4,'Bills':4.9,'Bengals':4.2,'49ers':4.7,'Giants':4.4
  };
  const BASE={QB:14.4,RB:4.6,WR:5.5,TE:5.6,K:7.1,DEF:5.2};
  const MULT={QB:.65,RB:1.65,WR:1.40,TE:1.15,K:.12,DEF:.24};
  const CAP={QB:5,RB:14,WR:14,TE:9,K:1,DEF:2};
  const RANK_BONUS={QB:2.0,RB:5.0,WR:5.0,TE:3.5,K:.5,DEF:1.0};
  const posOf=p=>String(p?.position||p?.pos||'').toUpperCase();
  const number=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  function projection(p,week){
    if(Number(week)===1 && Object.prototype.hasOwnProperty.call(WEEK1,p?.name)) return WEEK1[p.name];
    const imported=number(p?.projected);
    return imported;
  }
  function recent(p,week){
    if(Number(week)<=1)return '—';
    const v=number(p?.recent);
    return v==null?'—':v.toFixed(1);
  }
  function faab(p,week,rank,total){
    const pos=posOf(p),proj=projection(p,week);
    if(proj==null)return '—';
    const status=String(p?.status||'').toUpperCase();
    if(/IR|NA|OUT/.test(status) && proj<=0.1)return '$0';
    const edge=Math.max(0,proj-(BASE[pos]??0));
    const rankPct=Math.max(0,1-((Math.max(1,rank)-1)/Math.max(1,total)));
    let dollars=edge*(MULT[pos]??1)+rankPct*(RANK_BONUS[pos]??0);
    if(status==='Q')dollars*=.82;
    if(/IR-R/.test(status))dollars*=.30;
    if(pos==='K')dollars=Math.min(dollars,.75);
    if(pos==='DEF')dollars=Math.min(dollars,1.6);
    dollars=Math.max(0,Math.min(CAP[pos]??15,Math.round(dollars)));
    return `$${dollars}`;
  }
  function metrics(p,week,rank,total){
    const proj=projection(p,week);
    return {recent:recent(p,week),projected:proj==null?'—':proj.toFixed(1),faab:faab(p,week,rank,total)};
  }
  window.MEFFL_WAIVER_MODEL={version:'2026-W1-v1',week1:WEEK1,projection,recent,faab,metrics};
})();
