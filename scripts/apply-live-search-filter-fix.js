const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '.');
const webPath = path.join(root, 'www/index.html');
const androidPath = path.join(root, 'android/app/src/main/assets/index.html');
const web = fs.readFileSync(webPath, 'utf8');

let html = web;
html = html.replaceAll(
  'oninput="handleMonitorSearchInput(event)" onblur="handleMonitorSearchBlur()" autocomplete="off"',
  'oncompositionstart="monitorSearchComposing=true;clearTimeout(monitorSearchTimer)" oncompositionend="handleMonitorSearchCompositionEnd(event)" oninput="handleMonitorSearchInput(event)" onblur="handleMonitorSearchBlur()" autocomplete="off"'
);

const oldMonitor = \`// Filter Buah Masuk: jangan render tabel/ringkasan selama kolom pencarian
// masih fokus. Pada Android WebView, perubahan DOM berulang saat Gboard
// menyusun/menyerahkan teks dapat menggandakan karakter pada beberapa IME.
let monitorSearchPending=false;
function handleMonitorSearchInput(event){
 monitorSearchPending=true;
 // Biarkan pengeditan teks ditangani sepenuhnya oleh Android/Gboard.
 // Pembaruan daftar hanya dilakukan setelah kolom kehilangan fokus.
}
function handleMonitorSearchBlur(){
 if(!monitorSearchPending)return;
 monitorSearchPending=false;
 clearTimeout(timerDebounce);
 clearSelection();
 renderLiveTable();
}\`;
const newMonitor = \`// Filter Buah Masuk: render tabel dengan debounce setelah jeda ketikan.
// Input tetap menjadi node DOM yang sama; tidak pernah ditulis ulang atau
// difokuskan ulang sehingga komposisi Gboard dan posisi kursor tetap aman.
let monitorSearchTimer=null;
let monitorSearchComposing=false;
function scheduleMonitorSearchRender(delay=420){
 clearTimeout(monitorSearchTimer);
 monitorSearchTimer=setTimeout(()=>{
  monitorSearchTimer=null;
  renderLiveTable();
 },delay);
}
function handleMonitorSearchInput(event){
 // Jangan sentuh value/focus input. Debounce juga input IME agar daftar
 // mengikuti teks terbaru tanpa render berulang di setiap karakter.
 scheduleMonitorSearchRender(event?.inputType?.startsWith('delete')?180:420);
}
function handleMonitorSearchCompositionEnd(event){
 monitorSearchComposing=false;
 scheduleMonitorSearchRender(180);
}
function handleMonitorSearchBlur(){
 monitorSearchComposing=false;
 if(monitorSearchTimer){clearTimeout(monitorSearchTimer);monitorSearchTimer=null;renderLiveTable();}
}\`;
if (!html.includes(oldMonitor)) throw new Error('Blok filter Buah Masuk v44.4.0 tidak ditemukan; patch dihentikan.');
html = html.replace(oldMonitor, newMonitor);

const oldPayment = \`let paymentSearchRenderTimer=null;let paymentSearchComposing=false;
function schedulePaymentSearchRender(delay=250){
 clearTimeout(paymentSearchRenderTimer);
 paymentSearchRenderTimer=setTimeout(()=>{
  paymentSearchRenderTimer=null;
  // renderPaymentPage updates only result/KPI containers; the search input itself
  // is intentionally left untouched. Never call focus() or reset the caret
  // from a debounced callback: Android WebView/Gboard may restart IME composition
  // and duplicate committed characters when focus is reassigned mid-typing.
  renderPaymentPage();
 },delay);
}
function handlePaymentSearchInput(event){
 // Do not rewrite the input while Android/Gboard is composing a word.
 if(paymentSearchComposing||event?.isComposing)return;
 schedulePaymentSearchRender(event?.inputType?.startsWith('delete')?120:250);
}
function handlePaymentSearchCompositionEnd(event){
 paymentSearchComposing=false;
 // Wait for the final committed input event from the Android IME.
 schedulePaymentSearchRender(250);
}\`;
const newPayment = \`let paymentSearchRenderTimer=null;let paymentSearchComposing=false;
function schedulePaymentSearchRender(delay=420){
 clearTimeout(paymentSearchRenderTimer);
 paymentSearchRenderTimer=setTimeout(()=>{
  paymentSearchRenderTimer=null;
  // Only result/KPI/table containers are updated. The search input node,
  // value, focus and caret are never replaced or rewritten.
  renderPaymentPage();
 },delay);
}
function handlePaymentSearchInput(event){
 // Debounce every input event, including IME composition updates. A quiet
 // interval lets Gboard commit text before the table is refreshed.
 schedulePaymentSearchRender(event?.inputType?.startsWith('delete')?180:420);
}
function handlePaymentSearchCompositionEnd(event){
 paymentSearchComposing=false;
 schedulePaymentSearchRender(180);
}\`;
if (!html.includes(oldPayment)) throw new Error('Blok pencarian Pembayaran v44.4.0 tidak ditemukan; patch dihentikan.');
html = html.replace(oldPayment, newPayment);

fs.writeFileSync(webPath, html);
fs.writeFileSync(androidPath, html);

// Replace regression tests so they assert the live/debounced behavior and
// guarantee the Android packaged asset remains byte-identical to web source.
fs.writeFileSync(path.join(root, 'tests/search-input-markup-integrity.test.js'), \`const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'www/index.html'), 'utf8');
const packaged = fs.readFileSync(path.join(root, 'android/app/src/main/assets/index.html'), 'utf8');

test('Buah Masuk owner and driver filters debounce live table refresh without rewriting inputs', () => {
  for (const id of ['f-name', 'f-driver']) {
    const tag = html.match(new RegExp(\`<input\\\\\\\\b(?=[^>]*\\\\\\\\bid="\${id}")[^>]*>\`, 'i'))?.[0] || '';
    assert.ok(tag, \`missing \${id}\`);
    assert.ok(tag.includes('oninput="handleMonitorSearchInput(event)"'));
    assert.ok(tag.includes('oncompositionend="handleMonitorSearchCompositionEnd(event)"'));
    assert.ok(tag.includes('onblur="handleMonitorSearchBlur()"'));
    assert.ok(tag.includes('autocorrect="off"'));
    assert.ok(tag.includes('autocapitalize="off"'));
  }
  const inputFn = html.match(/function handleMonitorSearchInput\\\\(event\\\\)\\\\{[\\\\s\\\\S]*?\\\\n\\\\}/)?.[0] || '';
  assert.match(inputFn, /scheduleMonitorSearchRender/);
  assert.doesNotMatch(inputFn, /renderLiveTable|focus\\\\(|value\\\\s*=/);
  assert.match(html, /function scheduleMonitorSearchRender\\\\(delay=420\\\\)/);
  assert.match(html, /function handleMonitorSearchCompositionEnd\\\\(event\\\\)/);
});

test('web and Android Buah Masuk search implementations are identical', () => assert.equal(html, packaged));
\`);

fs.writeFileSync(path.join(root, 'tests/payment-search-ime-regression.test.js'), \`const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
const packaged=fs.readFileSync(path.join(root,'android/app/src/main/assets/index.html'),'utf8');

test('payment search uses a plain text input and disables text correction',()=>{
 const tag=html.match(/<input[^>]*id="pay-search"[^>]*>/)?.[0]||'';
 assert.ok(tag.includes('type="text"'));
 assert.ok(tag.includes('inputmode="text"'));
 assert.ok(tag.includes('enterkeyhint="done"'));
 for(const attr of ['autocomplete="off"','autocapitalize="off"','autocorrect="off"','spellcheck="false"'])assert.ok(tag.includes(attr),attr);
});

test('payment search debounces all IME input and refreshes results',()=>{
 const tag=html.match(/<input[^>]*id="pay-search"[^>]*>/)?.[0]||'';
 assert.match(tag,/oncompositionstart=/);
 assert.match(tag,/oncompositionend="handlePaymentSearchCompositionEnd\\\\(event\\\\)"/);
 assert.match(html,/function handlePaymentSearchInput\\\\(event\\\\)\\\\{[\\\\s\\\\S]*?schedulePaymentSearchRender\\\\(event\\\\?\\\\.inputType\\\\?\\\\.startsWith\\\\('delete'\\\\)\\\\?180:420\\\\)/);
 assert.match(html,/function handlePaymentSearchCompositionEnd\\\\(event\\\\)[\\\\s\\\\S]*?schedulePaymentSearchRender\\\\(180\\\\)/);
});

test('payment search never rewrites or refocuses the input',()=>{
 const fn=html.match(/function handlePaymentSearchInput\\\\(event\\\\)\\\\{[\\\\s\\\\S]*?\\\\n\\\\}/)?.[0]||'';
 assert.ok(fn);
 assert.doesNotMatch(fn,/\\\\.value\\\\s*=|innerHTML|\\\\.focus\\\\(/);
 const render=html.match(/function schedulePaymentSearchRender\\\\(delay=420\\\\)\\\\{[\\\\s\\\\S]*?\\\\n\\\\}/)?.[0]||'';
 assert.match(render,/renderPaymentPage\\\\(\\\\)/);
 assert.doesNotMatch(render,/\\\\.focus\\\\(|setSelectionRange/);
});

test('web and Android payment search implementations are identical',()=>assert.equal(html,packaged));
\`);
console.log('Applied live search filter patch to web and Android assets plus regression tests.');
