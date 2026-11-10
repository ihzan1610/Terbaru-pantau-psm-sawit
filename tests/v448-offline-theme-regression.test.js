const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('www/index.html','utf8');
test('v44.8 dark theme stylesheet is present and uses dark surface colors',()=>{
 assert.match(html,/PSM v44\.8\.0: genuine dark theme/);
 assert.match(html,/\.dark-mode body,\.dark-mode\{background:linear-gradient/);
 assert.match(html,/--bg:#111827/);
 assert.doesNotMatch(html,/DARK MODE DIMATIKAN SECARA VISUAL/);
});
test('local cache recovery mirror is enabled after IndexedDB hydration',()=>{
 assert.match(html,/WRITE_THROUGH_MARKER='__PSM_IDB_WRITE_THROUGH_V448__'/);
 assert.match(html,/nativeSet\.call\(nativeStorage,k,v\)/);
 assert.match(html,/nativeGet\.call\(nativeStorage,WRITE_THROUGH_MARKER\)==='1'/);
});
test('theme toggle applies and persists the selected mode',()=>{
 assert.match(html,/function applyPantauTheme\(mode\)/);
 assert.match(html,/function toggleDark\(\)\{const dark=!document\.body\.classList\.contains\('dark-mode'\)/);
 assert.match(html,/localStorage\.setItem\('psm_theme_monitor',dark\?'dark':'light'\)/);
});
test('startup waits for local database hydration before showing login',()=>{
 assert.match(html,/window\.onload=async\(\)=>\{ensureBackGuard\(\);try\{await window\.PSMStorageHealth\.readyPromise/);
});
