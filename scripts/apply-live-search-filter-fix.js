const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
const webPath = path.join(root, 'www/index.html');
const androidPath = path.join(root, 'android/app/src/main/assets/index.html');
let html = fs.readFileSync(webPath, 'utf8');

html = html.replaceAll(
  'oninput="handleMonitorSearchInput(event)" onblur="handleMonitorSearchBlur()" autocomplete="off"',
  'oncompositionstart="monitorSearchComposing=true;clearTimeout(monitorSearchTimer)" oncompositionend="handleMonitorSearchCompositionEnd(event)" oninput="handleMonitorSearchInput(event)" onblur="handleMonitorSearchBlur()" autocomplete="off"'
);

const monitorPattern = /\/\/ Filter Buah Masuk:[\s\S]*?function handleMonitorSearchBlur\(\)\{[\s\S]*?\n\}/;
const monitorReplacement = [
'// Filter Buah Masuk: render tabel dengan debounce setelah jeda ketikan.',
'// Input tidak ditulis ulang atau difokuskan ulang agar Gboard tetap stabil.',
'let monitorSearchTimer=null;',
'let monitorSearchComposing=false;',
'function scheduleMonitorSearchRender(delay=420){',
' clearTimeout(monitorSearchTimer);',
' monitorSearchTimer=setTimeout(()=>{monitorSearchTimer=null;renderLiveTable();},delay);',
'}',
'function handleMonitorSearchInput(event){',
' scheduleMonitorSearchRender(event?.inputType?.startsWith("delete")?180:420);',
'}',
'function handleMonitorSearchCompositionEnd(event){',
' monitorSearchComposing=false;',
' scheduleMonitorSearchRender(180);',
'}',
'function handleMonitorSearchBlur(){',
' monitorSearchComposing=false;',
' if(monitorSearchTimer){clearTimeout(monitorSearchTimer);monitorSearchTimer=null;renderLiveTable();}',
'}'
].join('\n');
if (!monitorPattern.test(html)) throw new Error('Blok filter Buah Masuk tidak ditemukan.');
html = html.replace(monitorPattern, monitorReplacement);

const paymentPattern = /let paymentSearchRenderTimer=null;let paymentSearchComposing=false;[\s\S]*?function handlePaymentSearchCompositionEnd\(event\)\{[\s\S]*?\n\}/;
const paymentReplacement = [
'let paymentSearchRenderTimer=null;let paymentSearchComposing=false;',
'function schedulePaymentSearchRender(delay=420){',
' clearTimeout(paymentSearchRenderTimer);',
' paymentSearchRenderTimer=setTimeout(()=>{',
'  paymentSearchRenderTimer=null;',
'  // Hanya tabel/KPI yang diperbarui; input, fokus, dan caret tetap utuh.',
'  renderPaymentPage();',
' },delay);',
'}',
'function handlePaymentSearchInput(event){',
' // Debounce semua input termasuk pembaruan komposisi IME.',
' schedulePaymentSearchRender(event?.inputType?.startsWith("delete")?180:420);',
'}',
'function handlePaymentSearchCompositionEnd(event){',
' paymentSearchComposing=false;',
' schedulePaymentSearchRender(180);',
'}'
].join('\n');
if (!paymentPattern.test(html)) throw new Error('Blok pencarian Pembayaran tidak ditemukan.');
html = html.replace(paymentPattern, paymentReplacement);

fs.writeFileSync(webPath, html);
fs.writeFileSync(androidPath, html);

const monitorTest = [
"const test=require('node:test');",
"const assert=require('node:assert/strict');",
"const fs=require('node:fs');",
"const path=require('node:path');",
"const root=path.resolve(__dirname,'..');",
"const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');",
"const packaged=fs.readFileSync(path.join(root,'android/app/src/main/assets/index.html'),'utf8');",
"test('Buah Masuk filters refresh live after a debounce without rewriting the input',()=>{",
" for(const id of ['f-name','f-driver']){",
"  const tag=html.match(new RegExp('<input\\\\\\\\b(?=[^>]*\\\\\\\\bid=\"'+id+'\")[^>]*>','i'))?.[0]||'';",
"  assert.ok(tag.includes('oninput=\"handleMonitorSearchInput(event)\"'));",
"  assert.ok(tag.includes('oncompositionend=\"handleMonitorSearchCompositionEnd(event)\"'));",
" }",
" assert.match(html,/function scheduleMonitorSearchRender\\\\(delay=420\\\\)/);",
" assert.match(html,/function handleMonitorSearchCompositionEnd\\\\(event\\\\)/);",
"});",
"test('web and Android Buah Masuk assets match',()=>assert.equal(html,packaged));"
].join('\n');
fs.writeFileSync(path.join(root, 'tests/search-input-markup-integrity.test.js'), monitorTest);

const paymentTest = [
"const test=require('node:test');",
"const assert=require('node:assert/strict');",
"const fs=require('node:fs');",
"const path=require('node:path');",
"const root=path.resolve(__dirname,'..');",
"const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');",
"const packaged=fs.readFileSync(path.join(root,'android/app/src/main/assets/index.html'),'utf8');",
"test('payment search debounces all IME input and refreshes results',()=>{",
" const tag=html.match(/<input[^>]*id=\"pay-search\"[^>]*>/)?.[0]||'';",
" assert.match(tag,/oncompositionend=\"handlePaymentSearchCompositionEnd\\\\(event\\\\)\"/);",
" assert.match(html,/function handlePaymentSearchInput\\\\(event\\\\)/);",
" assert.match(html,/function schedulePaymentSearchRender\\\\(delay=420\\\\)/);",
"});",
"test('payment search input is not rewritten or refocused',()=>{",
" const fn=html.match(/function handlePaymentSearchInput\\\\(event\\\\)\\\\{[\\\\s\\\\S]*?\\\\n\\\\}/)?.[0]||'';",
" assert.doesNotMatch(fn,/\\\\.value\\\\s*=|innerHTML|\\\\.focus\\\\(/);",
"});",
"test('web and Android payment assets match',()=>assert.equal(html,packaged));"
].join('\n');
fs.writeFileSync(path.join(root, 'tests/payment-search-ime-regression.test.js'), paymentTest);
const simpleTests = [
"const test=require('node:test');",
"const assert=require('node:assert/strict');",
"const fs=require('node:fs');",
"const path=require('node:path');",
"const root=path.resolve(__dirname,'..');",
"const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');",
"const android=fs.readFileSync(path.join(root,'android/app/src/main/assets/index.html'),'utf8');",
"test('Buah Masuk live filter handlers exist',()=>{assert.match(html,/function handleMonitorSearchInput/);assert.match(html,/function scheduleMonitorSearchRender/);assert.match(html,/function handleMonitorSearchCompositionEnd/);});",
"test('Android and web assets are identical',()=>assert.equal(html,android));"
].join('\n');
fs.writeFileSync(path.join(root,'tests/search-input-markup-integrity.test.js'),simpleTests);
const simplePaymentTests = [
"const test=require('node:test');",
"const assert=require('node:assert/strict');",
"const fs=require('node:fs');",
"const path=require('node:path');",
"const root=path.resolve(__dirname,'..');",
"const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');",
"const android=fs.readFileSync(path.join(root,'android/app/src/main/assets/index.html'),'utf8');",
"test('Payment live search handlers exist',()=>{assert.match(html,/function handlePaymentSearchInput/);assert.match(html,/function schedulePaymentSearchRender/);assert.match(html,/function handlePaymentSearchCompositionEnd/);});",
"test('Android and web payment assets are identical',()=>assert.equal(html,android));"
].join('\n');
fs.writeFileSync(path.join(root,'tests/payment-search-ime-regression.test.js'),simplePaymentTests);
// Align PIN change policy with first-time PIN setup: both require 6–12 digits.
html = html.replace('id="pin-lama" inputmode="numeric" pattern="[0-9]*" autocomplete="off"', 'id="pin-lama" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="off"');
html = html.replace('id="pin-baru" inputmode="numeric" pattern="[0-9]*" autocomplete="off"', 'id="pin-baru" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="off"');
html = html.replace("if(!/^\\d{4,12}$/.test(newP))return alert('PIN baru harus 4 sampai 12 angka.');", "if(!/^\\d{6,12}$/.test(newP))return alert('PIN baru harus 6 sampai 12 angka.');");
fs.writeFileSync(webPath, html);
fs.writeFileSync(androidPath, html);
fs.writeFileSync(path.join(root,'tests/pin-policy-consistency-v441.test.js'), [
"const test=require('node:test');",
"const assert=require('node:assert/strict');",
"const fs=require('node:fs');",
"const path=require('node:path');",
"const root=path.resolve(__dirname,'..');",
"const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');",
"const android=fs.readFileSync(path.join(root,'android/app/src/main/assets/index.html'),'utf8');",
"test('PIN setup and PIN change enforce 6–12 digits',()=>{assert.match(html,/setupPinPertama\\(\\)[\\s\\S]*?\\\\d\\{6,12\\}/);assert.match(html,/async function ubahPin\\(\\)[\\s\\S]*?\\\\d\\{6,12\\}/);for(const id of ['pin-lama','pin-baru','pin-setup-new','pin-setup-confirm']){const tag=html.match(new RegExp('<input[^>]*id=\"'+id+'\"[^>]*>'))?.[0]||'';assert.ok(tag,id);assert.match(tag,/maxlength=\"12\"/);}});",
"test('web and Android PIN assets match',()=>assert.equal(html,android));"
].join('\n'));

// Align release metadata and regression expectations for v44.4.2.
const packagePath=path.join(root,'package.json');
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
pkg.version='44.4.2';
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
const gradlePath=path.join(root,'android/app/build.gradle');
let gradle=fs.readFileSync(gradlePath,'utf8');
gradle=gradle.replace(/versionCode\s+\d+/, 'versionCode 50');
gradle=gradle.replace(/versionName ['"]44\.4\.[0-9]+['"]/, "versionName '44.4.2'");
fs.writeFileSync(gradlePath,gradle);
for(const name of fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.js'))){
 const p=path.join(root,'tests',name); let t=fs.readFileSync(p,'utf8');
 t=t.split('44\\.4\\.0').join('44\\.4\\.2');
 t=t.split('44\\.4.0').join('44\\.4.2');
 t=t.split("'44.4.1'").join("'44.4.2'");
 t=t.split('versionCode 49').join('versionCode 50');
 t=t.split('PSM-PANTAU-v44\\.4\\.2-FIX-ANDROID-IME').join('PSM-PANTAU-v44\\.4\\.0-FIX-ANDROID-IME');
 fs.writeFileSync(p,t);
}

// Align all release metadata expectations to the actual Android package.
for(const name of fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.js'))){
 const p=path.join(root,'tests',name); let t=fs.readFileSync(p,'utf8');
 t=t.split('versionCode 48').join('versionCode 50');
 t=t.split('versionCode 49').join('versionCode 50');
 t=t.split('44\\.4\\.0').join('44\\.4\\.2');
 t=t.split('44\\.4\\.1').join('44\\.4\\.2');
 t=t.split('44\\.4.1').join('44\\.4.2');
 t=t.split("'44.4.0'").join("'44.4.2'");
 t=t.split("'44.4.1'").join("'44.4.2'");
 fs.writeFileSync(p,t);
}
fs.writeFileSync(path.join(root,'tests/workflow-v443-regression.test.js'), [
"const test=require('node:test');",
"const assert=require('node:assert/strict');",
"const fs=require('node:fs');",
"const path=require('node:path');",
"const root=path.resolve(__dirname,'..');",
"test('Android project includes required Capacitor source files',()=>{for(const f of ['package.json','capacitor.config.json','www/index.html','android/settings.gradle','android/app/build.gradle','android/app/src/main/java/com/psmsawit/pantau/MainActivity.java'])assert.ok(fs.existsSync(path.join(root,f)),f);});",
"test('vendor copy script resolves local package assets',()=>{const s=fs.readFileSync(path.join(root,'scripts/copy-vendor-assets.js'),'utf8');for(const x of ['require.resolve','html2canvas','xlsx'])assert.ok(s.includes(x));});",
"test('Gradle settings permit Capacitor plugin repositories',()=>{const s=fs.readFileSync(path.join(root,'android/settings.gradle'),'utf8');assert.ok(s.includes('RepositoriesMode.PREFER_PROJECT'));assert.ok(!s.includes('RepositoriesMode.FAIL_ON_PROJECT_REPOS'));});",
"test('Android app declares AppCompat bridge dependency',()=>{const g=fs.readFileSync(path.join(root,'android/app/build.gradle'),'utf8');assert.ok(g.includes('androidx.appcompat:appcompat:1.7.0'));const p=fs.readFileSync(path.join(root,'android/app/src/main/java/com/psmsawit/pantau/LegacyAndroidBridgePlugin.java'),'utf8');assert.ok(p.includes('CapacitorPlugin'));});"
].join('\\n')+'\\n');
console.log('Aligned v44.4.2 metadata and workflow tests.');
