'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const script=fs.readFileSync('MEFFL_Weekly_Collector.user.js','utf8');
assert.match(script,/\/\/ @sandbox\s+DOM/);
assert.match(script,/\/\/ @version\s+1\.3\.12/);
assert.match(script,/\/\/ @run-at\s+document-end/);
function run(options={}){
  const nodes=new Map(),store=new Map(Object.entries(options.saved||{})),menus=new Map(),events={},writes=[],errors=[];
  let ready=!options.delayed,observer,clipboard='';
  const body={innerText:'2026 Season',appendChild(x){nodes.set(x.id,x);x.parent=this}};
  const attrs={};
  const doc={get body(){return ready?body:null},title:'Yahoo league',
    head:{appendChild(){}},documentElement:{appendChild(x){nodes.set(x.id,x)},setAttribute(k,v){attrs[k]=v}},
    querySelectorAll(){return []},getElementById(k){return nodes.get(k)||null},
    addEventListener(k,fn){events[k]=fn},
    createElement(){let html='';return {id:'',textContent:'',style:{cssText:'',setProperty(){}},
      get innerHTML(){return html},set innerHTML(v){if(options.rejectHTML)throw new TypeError('HTML assignment rejected');html=v},
      querySelector(){return {}},remove(){nodes.delete(this.id)}}}
  };
  const win={addEventListener(){}}; win.top=win.self=win;
  const path=options.path||'/f1/94870';
  const context={window:win,document:doc,location:{pathname:path,origin:'https://football.fantasysports.yahoo.com',href:'https://football.fantasysports.yahoo.com'+path,reload(){}},URL,
    GM_getValue(k,d){if(options.storageError)throw new Error('Test storage unavailable');return store.has(k)?store.get(k):d},
    GM_setValue(k,v){writes.push(k);store.set(k,v)},GM_deleteValue(k){store.delete(k)},
    GM_addStyle(){},GM_download(){},GM_setClipboard(t){clipboard=t},
    GM_registerMenuCommand(name,fn){menus.set(name,fn)},
    MutationObserver:class{constructor(fn){observer=fn}observe(){}},
    console:{warn(){},log(){},error(...v){errors.push(v.map(String).join(' '))}},
    setTimeout(){return 0}, Date,Math,Number,String,Array,Object,Boolean,RegExp,Set,Map,Promise};
  vm.runInNewContext(script,context,{filename:'MEFFL_Weekly_Collector.user.js',timeout:3000});
  if(options.delayed){ready=true;events.DOMContentLoaded?.()}
  return {nodes,store,writes,menus,attrs,errors,get clipboard(){return clipboard}};
}
const bound={'MEFFL:weeklyCollector:boundLeague':'2026:94870'};
const normal=run({saved:bound});
assert.ok(normal.nodes.has('meffl-panel'));
assert.equal(normal.attrs['data-meffl-startup'],'mounted');
assert.match(normal.nodes.get('meffl-startup-status').textContent,/Script running/);
assert.equal(normal.menus.size,2);
const denied=run({storageError:true});
assert.equal(denied.attrs['data-meffl-startup'],'startup-error');
assert.match(denied.nodes.get('meffl-startup-status').textContent,/Test storage unavailable/);
assert.equal(denied.writes.length,0);
const reject=run({saved:bound,rejectHTML:true});
assert.equal(reject.attrs['data-meffl-startup'],'startup-error');
assert.match(reject.nodes.get('meffl-startup-status').textContent,/HTML assignment rejected/);
const malformed=run({saved:{...bound,'MEFFL:2026:94870:collectorVersion':'1.3.12','MEFFL:2026:94870:state':{targetWeek:10,captures:[{text:'private fixture'}],data:{rosters:{}},teamMap:[]}}});
assert.equal(malformed.attrs['data-meffl-startup'],'startup-error');
assert.equal(malformed.writes.length,0,'failed validation must not overwrite prior captures');
assert.equal(malformed.store.get('MEFFL:2026:94870:state').captures[0].text,'private fixture');
const delayed=run({saved:bound,delayed:true});
assert.ok(delayed.nodes.has('meffl-panel'));
assert.equal(delayed.attrs['data-meffl-startup'],'mounted');
const other=run({path:'/f1/471058'});
assert.equal(other.nodes.size,0);assert.equal(other.writes.length,0);assert.equal(other.menus.size,0);
normal.nodes.get('meffl-startup-status').remove();
normal.menus.get('MEFFL v1.3.12: Show collector / startup status')();
assert.ok(normal.nodes.has('meffl-startup-status'));
normal.menus.get('MEFFL v1.3.12: Copy startup diagnostic')();
const diagnostic=JSON.parse(normal.clipboard);
assert.deepEqual(Object.keys(diagnostic).sort(),['error','panelPresent','path','phase','version'].sort());
assert.equal(diagnostic.version,'1.3.12');
assert.equal(diagnostic.panelPresent,true);
console.log('MEFFL visible-startup tests PASSED: normal mount, delayed body, storage failure, HTML rejection, malformed state preservation, other-league exclusion, menu recovery and data-free diagnostics.');
