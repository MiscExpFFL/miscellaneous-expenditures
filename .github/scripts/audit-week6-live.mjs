import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const origin=(process.env.BASE_URL||'https://www.miscellaneousexpenditures.com').replace(/\/+$/,'');
const dest=path.resolve('audit-out/week6');
fs.mkdirSync(dest,{recursive:true});
const started=new Date().toISOString();
const routes=[
 ['home','/'],['weeks','/weeks.html'],['week5','/week.html?week=5'],
 ['week6','/week.html?week=6'],['week6redirect','/week-06.html'],
 ['season','/season-2026.html'],['schedule','/schedule.html'],
 ['power','/power-rankings.html'],['odds','/playoff-odds.html'],
 ['predictions','/predictions.html'],['analytics','/analytics.html'],
 ['transactions','/transactions.html'],['waivers','/waiver-wire.html'],
 ['franchises','/franchises.html'],['h2h','/head-to-head.html'],
 ['records','/record-book.html'],['history','/history.html'],
 ['press','/press-room.html'],['draft','/draft-history.html'],
 ['keepers','/keepers.html'],['trophies','/trophy-case.html'],
 ['shame','/hall-of-shame.html'],['archive2025','/season-2025.html'],
 ['archive2024','/season-2024.html'],['archive2023','/season-2023.html'],
 ...['Andrew','Christopher','Danny','Harry','Matt F.','Matty B.','Owen','Patrick','Tom','Tommy']
    .map(manager=>['franchise-'+manager.toLowerCase().replace(/[^a-z]+/g,'-'),
        '/franchise.html?manager='+encodeURIComponent(manager)])
];
const mobileIds=new Set(['home','weeks','week5','week6','season','schedule','power','odds',
  'predictions','analytics','franchises','h2h','records','press','waivers','franchise-tom']);
const screenshots=new Set(['home','week5','week6','power','odds','analytics','press','schedule','franchise-tom']);
const result={origin,started,commit:process.env.GITHUB_SHA||null,
  checks:[],failures:[],warnings:[],screenshots:[]};
let browser=null;
function fail(name,message){const line={name,message};result.failures.push(line);console.error('FAIL',name,message)}
function note(name,message){result.warnings.push({name,message});console.warn('WARN',name,message)}
function persist(){result.finished=new Date().toISOString();
  result.ok=result.failures.length===0;
  fs.writeFileSync(path.join(dest,'summary.json'),JSON.stringify(result,null,2));
  fs.writeFileSync(path.join(dest,'summary.txt'),
    ['MEFFL WEEK 6 BROWSER AUDIT', 'Started: '+started,'Finished: '+result.finished,
    'URL: '+origin,'Commit: '+result.commit,'Checks: '+result.checks.length,
    'Failures: '+result.failures.length,'Warnings: '+result.warnings.length,
    ...result.failures.map(f=>'FAIL '+f.name+': '+f.message),
    ...result.warnings.map(w=>'WARN '+w.name+': '+w.message)].join('\n')+'\n');
}
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const mode of ['desktop','mobile']){
  const viewport=mode==='desktop'?{width:1440,height:900}:{width:390,height:844};
  const context=await browser.newContext({viewport,deviceScaleFactor:1,
    userAgent:mode==='mobile'?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1':undefined,
    ignoreHTTPSErrors:false});
  const page=await context.newPage();page.setDefaultTimeout(18000);
  for(const [id,pathname] of routes){
    if(mode==='mobile'&&!mobileIds.has(id))continue;
    const label=mode+'/'+id;const errors=[],bad=[];
    page.removeAllListeners('pageerror');page.removeAllListeners('console');
    page.removeAllListeners('response');page.removeAllListeners('requestfailed');
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,250)));
    page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text().slice(0,250))});
    page.on('response',resp=>{if(resp.status()>=400&&resp.url().startsWith(origin))
      bad.push(resp.status()+' '+resp.url().slice(0,220))});
    page.on('requestfailed',request=>{if(request.url().startsWith(origin))
      bad.push('request failed: '+request.url().slice(0,200)+' '+request.failure()?.errorText)});
    let httpStatus=0;
    try{
      const response=await page.goto(origin+pathname,{waitUntil:'load',timeout:35000});
      httpStatus=response?.status()||0;
      if(httpStatus>=400||!httpStatus)fail(label,'HTTP '+httpStatus);
      await page.waitForTimeout(450);
      const view=await page.evaluate(()=>{
        const y=window.SEASON_2026,engine=window.MEFFL_ENGINE;
        const body=document.body,txt=body?.innerText||'';
        const power=engine?.powerMetrics?.()||[],odds=engine?.simulate?.()||[];
        const scripts=[...document.querySelectorAll('script[src]')].map(e=>e.src);
        const imgs=[...document.images].filter(img=>img.complete&&img.naturalWidth===0).map(i=>i.src);
        const links=[...document.querySelectorAll('nav a[href]')].length;
        return {
          textLength:txt.length,title:document.title,h1:document.querySelector('h1')?.innerText?.slice(0,130),
          page:body?.dataset?.page??null,week:y?.week??null,
          completed:y?.collectorStatus?.completedWeek??null,
          standings:y?.standings?.length??null,resultsWeek5:y?.results?.filter(x=>x.week===5).length??null,
          lock5:y?.predictionSnapshots?.['5']?.locked??false,
          lock6:y?.predictionSnapshots?.['6']?.locked??false,
          w5status:y?.weekly?.['5']?.status??null,w6status:y?.weekly?.['6']?.status??null,
          powerTop:power[0]?.team||'',powerCount:power.length,
          oddsCount:odds.length,
          stockPrice:window.MEFFL_UPGRADES?.stockRows?.().find(x=>x.team==='SFPAL Junior 49ers')?.price??null,
          pressText:document.querySelector('#press-league-desk')?.innerText?.slice(0,800)||null,
          receiptsText:document.querySelector('#press-prediction-receipts')?.innerText?.slice(0,800)||null,
          content:txt.slice(0,45000),
          viewportWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
          navLinks:links,scriptCount:scripts.length,
          week6Cache:scripts.some(s=>s.includes('me-weekly-sync.js?v=meffl-20261014-w6p5')),
          missingImages:imgs.slice(0,12),
          emptyHeader:!(body?.querySelector('h1,h2')),
          cssPresent:getComputedStyle(body).fontFamily.length>0
        }
      });
      const check={label,httpStatus,title:view.title,h1:view.h1,textLength:view.textLength,
        week:view.week,resultsWeek5:view.resultsWeek5,navLinks:view.navLinks,scriptCount:view.scriptCount,
        scrollWidth:view.scrollWidth,viewportWidth:view.viewportWidth,
        powerTop:view.powerTop,stockPrice:view.stockPrice,errors:errors.slice(),failedRequests:bad.slice(),
        brokenImages:view.missingImages};
      result.checks.push(check);
      if(view.textLength<150)fail(label,'Insufficient rendered text: '+view.textLength);
      if(!view.cssPresent||view.emptyHeader)fail(label,'Missing page styling or headings');
      if(id==='home'&&view.navLinks<12)fail(label,'Expected site navigation links, got '+view.navLinks);
      if(view.week!==null){
        if(view.week!==6)fail(label,'Stale active week: '+view.week);
        if(view.completed!==5)fail(label,'Completed week should be 5, got '+view.completed);
        if(view.standings!==10||view.resultsWeek5!==5)fail(label,'Standings or Week 5 finals incomplete: '+view.standings+'/'+view.resultsWeek5);
        if(!view.lock5||!view.lock6)fail(label,'Prior or current prediction receipts not locked');
        if(view.powerCount&&view.powerTop!=='SFPAL Junior 49ers')fail(label,'Wrong Power leader: '+view.powerTop);
        if(view.oddsCount&&view.oddsCount!==10)fail(label,'Wrong odds board count '+view.oddsCount);
        if(!view.week6Cache)fail(label,'Week 6 script cache key absent');
      }
      if(id==='week5'&&(!view.content.includes('165.40')||!view.content.includes('143.84')))
        fail(label,'Week 5 recap / final scores not rendered');
      if(id==='week6'&&(!view.content.includes('Week 6')||!view.content.includes('SFPAL Junior 49ers')||!view.content.includes('Rise of the Pleasure Machines')))
        fail(label,'Week 6 editorial or GOTW absent');
      if(id==='power'&&!view.content.includes('SFPAL Junior 49ers'))
        fail(label,'Power table missing SFPAL');
      if(id==='odds'&&!view.content.includes('98.1'))
        fail(label,'SFPAL playoff odds missing');
      if(id==='predictions'&&(!view.content.includes('ME')||!view.content.includes('Yahoo')))
        fail(label,'Prediction table missing model names');
      if(id==='analytics'&&(!view.content.includes('Lineup Autopsy')||!view.content.includes('Front Office')))
        fail(label,'Analytics panels missing');
      if(id==='press'&&(!view.pressText?.includes('WEEK 6')||!view.receiptsText?.includes('WEEK 6')))
        fail(label,'Press archive missing Week 6 editorial or prediction receipt');
      if(view.stockPrice!==null&&Math.abs(view.stockPrice-90.05)>.015)
        fail(label,'Stock leader disagrees with frozen model: '+view.stockPrice);
      if(view.scrollWidth>view.viewportWidth+18)
        note(label,'Horizontal page overflow '+view.scrollWidth+' vs '+view.viewportWidth);
      for(const src of view.missingImages)note(label,'Broken image '+src);
      for(const item of bad)fail(label,'Broken same-origin request '+item);
      for(const error of errors)fail(label,'Browser error '+error);
      if(screenshots.has(id)){
        const screenshot=path.join(dest,mode+'-'+id+'.png');
        try{await page.screenshot({path:screenshot,fullPage:true,timeout:20000});result.screenshots.push(screenshot)}
        catch(e){note(label,'Screenshot failed '+String(e).slice(0,150))}
      }
      console.log('PASS-THROUGH',label,'HTTP',httpStatus,'text',view.textLength,'week',view.week,
        'browserErrors',errors.length,'httpErrors',bad.length);
    }catch(e){
      fail(label,'Navigation or JS inspection exception: '+String(e).slice(0,450));
      if(id==='home'){
        note('audit','Homepage unavailable: skipping remaining routes for '+mode+' due to unavailable public origin.');
        break;
      }
    }
  }
  await context.close();
 }
}catch(e){fail('setup','Chromium startup or test setup: '+String(e))}
finally{if(browser)await browser.close();persist()}
console.log('AUDIT_RESULT',JSON.stringify({ok:result.ok,checks:result.checks.length,
  failures:result.failures.length,warnings:result.warnings.length,report:path.join(dest,'summary.txt')}));
process.exitCode=result.ok?0:1;
