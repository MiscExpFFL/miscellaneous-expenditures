'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('MEFFL_Weekly_Collector.user.js','utf8');
const source=fs.readFileSync('.github/collector_parts/part01.txt','utf8');
const archived=fs.readFileSync('MEFFL_Weekly_Collector_v1.3.12.txt','utf8');
assert.equal(script,source,'installed script must match canonical source');
assert.equal(archived,source,'versioned script must match canonical source');
assert.ok(script.includes('@version      1.3.12'),'correct Tampermonkey version');
assert.ok(script.includes('@match        https://football.fantasysports.yahoo.com/league/*'),'Yahoo custom league route must match');

function scenario(path,opts={}){
  const base='https://football.fantasysports.yahoo.com';
  const href=base+path;
  const saved=new Map(Object.entries(opts.saved||{}));
  const nodes=new Map();
  const listeners={};
  let hasBody=!opts.delayBody;
  let observerCallback=null;
  const body={innerText:'2026 Season',appendChild(el){nodes.set(el.id,el)}};
  const doc={
    get body(){return hasBody?body:null},
    head:{appendChild(){}},
    documentElement:{appendChild(){}},
    title:'Miscellaneous Expenditures Yahoo',
    querySelectorAll(){return opts.links||[]},
    addEventListener(name,fn){listeners[name]=fn},
    getElementById(id){return nodes.get(id)||null},
    createElement(){return {
      id:'',style:{},innerHTML:'',querySelector(){return {}}
    }}
  };
  class Observer{
    constructor(fn){observerCallback=fn}
    observe(){}
  }
  const location={origin:base,href,pathname:path.split('?')[0],reload(){}};
  const fakeWindow={addEventListener(){}};
  const sandbox={
    window:fakeWindow,document:doc,location,URL,MutationObserver:Observer,
    GM_getValue:(k,v)=>saved.has(k)?saved.get(k):v,
    GM_setValue:(k,v)=>saved.set(k,v),
    GM_deleteValue:k=>saved.delete(k),
    GM_addStyle(){},GM_download(){},GM_setClipboard(){},
    console:{log(){},warn(){},error(){}},
    setTimeout:()=>0,
    Date,Math,Number,String,Array,Object,Boolean,RegExp,Set,Map,Promise,
  };
  vm.runInNewContext(script,sandbox,{filename:'MEFFL_Weekly_Collector.user.js',timeout:3000});
  if(opts.delayBody){hasBody=true;listeners.DOMContentLoaded?.()}
  if(opts.removePanel){nodes.delete('meffl-panel');observerCallback?.()}
  return {panel:nodes.get('meffl-panel'),saved};
}
const bound={'MEFFL:weeklyCollector:boundLeague':'2026:94870'};
assert.match(scenario('/f1/94870').panel?.innerHTML||'',/USE COLLECTOR ON THIS LEAGUE/);
assert.match(scenario('/f1/94870',{saved:bound}).panel?.innerHTML||'',/AUTO COLLECT LEAGUE/);
assert.match(scenario('/f1/show?lid=94870',{saved:bound}).panel?.innerHTML||'',/AUTO COLLECT LEAGUE/);
assert.match(scenario('/league/misc-exp',{saved:bound,links:[{href:'https://football.fantasysports.yahoo.com/f1/94870'}]}).panel?.innerHTML||'',/AUTO COLLECT LEAGUE/);
assert.match(scenario('/league/misc-exp').panel?.innerHTML||'',/Open Miscellaneous Expenditures/);
assert.equal(scenario('/f1/471058').panel,undefined,'must not activate on Makers');
assert.match(scenario('/f1/94870',{saved:bound,delayBody:true}).panel?.innerHTML||'',/AUTO COLLECT LEAGUE/);
assert.match(scenario('/f1/94870',{saved:bound,removePanel:true}).panel?.innerHTML||'',/AUTO COLLECT LEAGUE/);
const inProgress={'MEFFL:weeklyCollector:boundLeague':'2026:94870',
  'MEFFL:2026:94870:collectorVersion':'1.3.10',
  'MEFFL:2026:94870:state':{mode:'WEDNESDAY',targetWeek:10,captures:[{url:'existing',kind:'league'}],data:{standings:[{team:'SVDBaller'}]},teamMap:[]}};
const migrated=scenario('/f1/94870',{saved:inProgress}).saved.get('MEFFL:2026:94870:state');
assert.equal(migrated.captures.length,1,'upgrade must preserve page captures');
assert.equal(migrated.data.standings.length,1,'upgrade must preserve collected facts');
assert.equal(migrated.targetWeek,10,'upgrade must preserve in-progress target week');
console.log('MEFFL activation smoke tests PASSED (routes, binding, delayed mount, SPA restore, state migration)');
