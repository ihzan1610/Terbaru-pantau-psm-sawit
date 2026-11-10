const fs=require('node:fs'),path=require('node:path'),root=path.resolve(process.argv[2]||'.');
const web=path.join(root,'www/index.html'),asset=path.join(root,'android/app/src/main/assets/index.html');
let s=fs.readFileSync(web,'utf8');
if(!s.includes('PSM_IDB_WRITE_THROUGH_V448')){
 s=s.replace("  const nativeStorage=window.localStorage;\n", "  const nativeStorage=window.localStorage;\n  const WRITE_THROUGH_MARKER='__PSM_IDB_WRITE_THROUGH_V448__';\n  let writeThroughEnabled=false;\n");
 s=s.replace("    const rows=await readAll(), idbByKey=new Map(rows.map(r=>[String(r.key),r]));\n    const priorMeta=await readMeta('runtime_primary_v3');", "    const rows=await readAll(), idbByKey=new Map(rows.map(r=>[String(r.key),r]));\n    const priorMeta=await readMeta('runtime_primary_v3');\n    writeThroughEnabled=nativeGet.call(nativeStorage,WRITE_THROUGH_MARKER)==='1';");
 s=s.replace('if(migrationAlreadyComplete&&row&&valid){','if(migrationAlreadyComplete&&row&&valid&&!writeThroughEnabled){');
 s=s.replace("      cache.set(k,v);\n      enqueue(()=>putDurable(k,v),k);", "      cache.set(k,v);\n      if(writeThroughEnabled){try{nativeSet.call(nativeStorage,k,v);}catch(e){writeThroughEnabled=false;try{nativeRemove.call(nativeStorage,WRITE_THROUGH_MARKER);}catch(_){}console.warn('[PSM IndexedDB] Snapshot sinkron penuh; IndexedDB tetap menjadi penyimpanan utama.',e);}}\n      enqueue(()=>putDurable(k,v),k);");
 s=s.replace("      const k=String(key);cache.delete(k);\n      enqueue(()=>deleteDurable(k),k);", "      const k=String(key);cache.delete(k);\n      if(writeThroughEnabled){try{nativeRemove.call(nativeStorage,k);}catch(e){writeThroughEnabled=false;try{nativeRemove.call(nativeStorage,WRITE_THROUGH_MARKER);}catch(_){}}}\n      enqueue(()=>deleteDurable(k),k);");
 s=s.replace("    installCompatibilityAPI();\n    ready=true;", "    installCompatibilityAPI();\n    // One-time synchronous recovery mirror protects against Android process termination.\n    if(!writeThroughEnabled){try{for(const [k,v] of cache)nativeSet.call(nativeStorage,k,v);nativeSet.call(nativeStorage,WRITE_THROUGH_MARKER,'1');writeThroughEnabled=true;}catch(e){try{nativeRemove.call(nativeStorage,WRITE_THROUGH_MARKER);}catch(_){}console.warn('[PSM IndexedDB] Mirror pemulihan tidak muat; IndexedDB tetap menjadi penyimpanan utama.',e);}}\n    ready=true;");
}
const start=s.indexOf('/* DARK MODE DIMATIKAN SECARA VISUAL: tetap terang, bukan gelap */');
const end=s.indexOf('/* ===== FIX v18: GAMBAR STRUK UTUH + PREVIEW RAPI ===== */',start);
if(start<0||end<0)throw new Error('Blok tema lama tidak ditemukan');
const css=`/* PSM v44.8.0: genuine dark theme; light mode remains the default. */
.dark-mode{--primary:#4F9B78;--primary2:#75B894;--accent:#E6B85C;--bg:#111827;--surface:#1F2937;--text:#F3F6FB;--muted:#B8C4D8;--border:#374151;--tab-bg:#1F2937}
.dark-mode body,.dark-mode{background:linear-gradient(180deg,#0B1220 0%,#111827 55%,#172033 100%)!important;color:#F3F6FB!important}
.dark-mode .app-header{background:linear-gradient(135deg,#183B32 0%,#245542 55%,#183B32 100%)!important;color:#F3F6FB!important}
.dark-mode .app-header h1{color:#F3F6FB!important}
.dark-mode .card,.dark-mode .summary-card,.dark-mode .smart-item,.dark-mode .trend-box,.dark-mode .modal-content{background:#1F2937!important;border-color:#374151!important;color:#F3F6FB!important;box-shadow:0 7px 18px rgba(0,0,0,.18)!important}
.dark-mode .card-title,.dark-mode .card h3,.dark-mode .trend-head h4{color:#9AD5B5!important}
.dark-mode label{color:#C3CFDF!important}
.dark-mode input,.dark-mode select,.dark-mode textarea{background:#111827!important;color:#F3F6FB!important;border-color:#475569!important}
.dark-mode input[readonly]{background:#374151!important;color:#CBD5E1!important}
.dark-mode th{background:#263854!important;color:#F6F8FC!important}
.dark-mode td{color:#E5EAF2!important;border-bottom-color:#374151!important}
.dark-mode .summary-card,.dark-mode .smart-item,.dark-mode .trend-canvas-wrap,.dark-mode .trend-analysis{background:#1F2937!important;border-color:#374151!important}
.dark-mode .quick-row button{background:#334155!important;color:#E2E8F0!important;border-color:#475569!important}
.dark-mode .custom-suggest,.dark-mode .custom-suggest div{background:#1F2937!important;color:#F3F6FB!important}
.dark-mode .custom-suggest div:hover,.dark-mode .custom-suggest div:active{background:#334155!important}

`;
s=s.slice(0,start)+css+s.slice(end);
s=s.replace("function toggleDark(){document.body.classList.toggle('dark-mode');localStorage.setItem('psm_theme_monitor',document.body.classList.contains('dark-mode')?'dark':'light')}","function applyPantauTheme(mode){const dark=mode==='dark';document.documentElement.classList.toggle('dark-mode',dark);document.body.classList.toggle('dark-mode',dark);try{localStorage.setItem('psm_theme_monitor',dark?'dark':'light')}catch(e){console.warn('Preferensi tema belum tersimpan',e)}return dark}\nfunction toggleDark(){const dark=!document.body.classList.contains('dark-mode');applyPantauTheme(dark?'dark':'light');return dark}");
s=s.replace("if(localStorage.getItem('psm_theme_monitor')==='dark')document.body.classList.add('dark-mode');","applyPantauTheme(localStorage.getItem('psm_theme_monitor')==='dark'?'dark':'light');");
fs.writeFileSync(web,s);fs.writeFileSync(asset,s);
const pkg=path.join(root,'package.json'),j=JSON.parse(fs.readFileSync(pkg,'utf8'));j.version='44.8.0';fs.writeFileSync(pkg,JSON.stringify(j,null,2)+'\n');
const gradle=path.join(root,'android/app/build.gradle');fs.writeFileSync(gradle,fs.readFileSync(gradle,'utf8').replace('versionCode 48','versionCode 50').replace("versionName '44.4.0'","versionName '44.8.0'"));
for(const f of fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.test.js'))){const p=path.join(root,'tests',f);let t=fs.readFileSync(p,'utf8').replaceAll("44\\.4.0","44\\.8.0").replaceAll('44.4.0','44.8.0').replace('if(migrationAlreadyComplete&&row&&valid)','if(migrationAlreadyComplete&&row&&valid&&!writeThroughEnabled)');fs.writeFileSync(p,t)}
// Align pre-existing source regression expectations with the new release version and recovery branch.
const releaseTest=path.join(root,'tests/release-build-config.test.js');
if(fs.existsSync(releaseTest)){let t=fs.readFileSync(releaseTest,'utf8').replaceAll('44.7.0','44.8.0');fs.writeFileSync(releaseTest,t);}
const migrationTest=path.join(root,'tests/technology-migration-v42.test.js');
if(fs.existsSync(migrationTest)){let t=fs.readFileSync(migrationTest,'utf8').replace(/if\\\\\\(migrationAlreadyComplete&&row&&valid\\\\\\)/g,'if\\\\(migrationAlreadyComplete&&row&&valid(?:&&!writeThroughEnabled)?\\\\)');fs.writeFileSync(migrationTest,t);}
console.log('PSM Pantau cache/theme v44.8.0 applied');
