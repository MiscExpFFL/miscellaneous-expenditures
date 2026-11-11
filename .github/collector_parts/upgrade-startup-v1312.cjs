'use strict';
// One-time, source-preserving migration. Parser and collected-data logic are unchanged.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = '.github/collector_parts/part01.txt';
let source = fs.readFileSync(path, 'utf8');
if (source.includes('// @version      1.3.12')) {
  assert.ok(source.includes('// @sandbox      DOM'));
  assert.ok(source.includes('MEFFL_STARTUP_1312'));
  console.log('v1.3.12 startup migration already applied.');
  process.exit(0);
}
assert.ok(source.includes('// @version      1.3.11'), 'Unexpected source version; do not overwrite');
const delimiter = '// ==/UserScript==';
const end = source.indexOf(delimiter) + delimiter.length;
assert.ok(end > delimiter.length);
let header = source.slice(0, end)
  .replace('// @version      1.3.11', '// @version      1.3.12')
  .replace('// @run-at       document-idle', '// @run-at       document-end\n// @sandbox      DOM\n// @noframes\n// @grant        GM_registerMenuCommand');
assert.ok(header.includes('// @sandbox      DOM'));
const originalBody = source.slice(end).trim();
assert.ok(originalBody.startsWith('(function(){'));
assert.ok(originalBody.endsWith('})();'));
const collectorBody = originalBody.replace("const VERSION='1.3.11';", "const VERSION='1.3.12';");
assert.notEqual(collectorBody, originalBody);
const prefix = String.raw`

(function(){
  'use strict';
  // MEFFL_STARTUP_1312: this marker is set before storage access or collector rendering.
  const release = '1.3.12';
  let phase = 'not started';
  let lastError = '';
  const pathname = String(location.pathname || '');
  const query = new URL(location.href).searchParams;
  const id = pathname.match(/\/f1\/(\d+)(?:\/|$)/)?.[1] || query.get('lid') || query.get('leagueId') || '';
  if (id && id !== '94870') return;
  if (window.top && window.self && window.top !== window.self) return;

  function notice(message, failed){
    const parent = document.body || document.documentElement;
    if (!parent) return;
    let box = document.getElementById('meffl-startup-status');
    if (!box) {
      box = document.createElement('aside');
      box.id = 'meffl-startup-status';
      parent.appendChild(box);
    }
    // Text-only fallback deliberately does not use innerHTML or a page script injection.
    box.textContent = 'MEFFL v' + release + ' — ' + message;
    box.style.cssText = 'position:fixed!important;top:12px!important;right:12px!important;bottom:auto!important;left:auto!important;display:block!important;visibility:visible!important;opacity:1!important;z-index:2147483647!important;max-width:min(380px,calc(100vw - 24px))!important;padding:12px 14px!important;border:2px solid ' + (failed ? '#ffb86b' : '#d9ad32') + '!important;border-radius:10px!important;background:#17090b!important;color:#fff!important;font:13px/1.45 Arial,sans-serif!important;white-space:pre-wrap!important;box-shadow:0 6px 28px #0006!important;';
    box.title = 'Click to dismiss this startup status. The Tampermonkey menu can show it again.';
    box.onclick = () => box.remove?.();
    document.documentElement?.setAttribute?.('data-meffl-startup', phase);
    document.documentElement?.setAttribute?.('data-meffl-version', release);
  }
  function showStatus(){
    const panel = document.getElementById('meffl-panel');
    if (panel && panel.style) {
      panel.style.setProperty?.('display', 'block', 'important');
      panel.style.setProperty?.('visibility', 'visible', 'important');
      panel.style.setProperty?.('opacity', '1', 'important');
      panel.style.setProperty?.('z-index', '2147483646', 'important');
      panel.style.setProperty?.('max-height', 'calc(100vh - 90px)', 'important');
      panel.style.setProperty?.('overflow-y', 'auto', 'important');
    }
    notice(lastError || (panel ? 'Script running; collector panel is mounted.' : 'Script started, but the collector panel did not mount. No saved captures have been cleared.'), !!lastError || !panel);
  }
  try {
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('MEFFL v1.3.12: Show collector / startup status', showStatus);
      GM_registerMenuCommand('MEFFL v1.3.12: Copy startup diagnostic', () => {
        const text = JSON.stringify({version:release, phase, error:lastError, path:pathname, panelPresent:!!document.getElementById('meffl-panel')}, null, 2);
        if (typeof GM_setClipboard === 'function') GM_setClipboard(text, 'text');
        notice('Startup diagnostic copied. It contains no cookies, saved captures, or roster data.', false);
      });
    }
  } catch (error) { console.warn('[MEFFL] Menu registration failed', error); }

  function runCollector(){
`;
const suffix = String.raw`
  }
  function begin(){
    if (!document.body) return;
    phase = 'starting';
    notice('Starting collector…', false);
    try {
      runCollector();
      phase = document.getElementById('meffl-panel') ? 'mounted' : 'not-mounted';
      showStatus();
    } catch (error) {
      phase = 'startup-error';
      lastError = 'Startup stopped: ' + String(error?.name || 'Error') + ': ' + String(error?.message || error).slice(0,240) + '. Saved captures have not been cleared.';
      notice(lastError, true);
      console.error('[MEFFL v1.3.12 startup]', error);
    }
  }
  if (document.body) begin();
  else document.addEventListener('DOMContentLoaded', begin, {once:true});
})();
`;
const result = header + prefix + collectorBody + suffix;
new (require('node:vm').Script)(result, {filename:'MEFFL_Weekly_Collector.user.js'});
// Prove the entire prior collector body is preserved, except for its version string.
assert.equal(result.slice(result.indexOf(collectorBody), result.indexOf(collectorBody)+collectorBody.length), collectorBody);
fs.writeFileSync(path, result);
const tests = '.github/collector_parts/activation-smoke.test.cjs';
let testSource = fs.readFileSync(tests, 'utf8');
testSource = testSource.replaceAll('1.3.11', '1.3.12');
fs.writeFileSync(tests, testSource);
console.log('Applied MEFFL v1.3.12: DOM sandbox, visible startup status, recover menu, guarded initialization; parser body preserved.');
