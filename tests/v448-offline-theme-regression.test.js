const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('www/index.html','utf8');
test('v44.8 restores a real dark palette instead of overriding dark mode with light colors',()=>{
 assert.match(html,/PSM v44\.8: tema gelap aktif/);
 assert.match(html,/\.dark-mode\{\s*color-scheme:dark/);
 assert.match(html,/--bg:#111827/);
 assert.doesNotMatch(html,/DARK MODE DIMATIKAN SECARA VISUAL/);
});
test('Cloud cache is durably flushed before the live Cloud state is replaced',()=>{
 const at=html.indexOf('PSM_V448_CLOUD_DURABLE_COMMIT');
 assert.notEqual(at,-1);
 const flush=html.indexOf('await window.PSMStorageHealth.flush()',at);
 const live=html.indexOf('cloudKebun=incoming',at);
 assert.ok(flush>at&&live>flush,'flush must precede replacing in-memory Cloud state');
});
test('theme selection is persisted and flushed to IndexedDB',()=>{
 assert.match(html,/function toggleDark\(\)[\s\S]*?localStorage\.setItem\('psm_theme_monitor'/);
 assert.match(html,/Tema belum tersimpan permanen/);
});
test('startup still hydrates IndexedDB before login and system initialization',()=>{
 assert.match(html,/window\.onload=async\(\)=>\{ensureBackGuard\(\);try\{await window\.PSMStorageHealth\.readyPromise/);
});
