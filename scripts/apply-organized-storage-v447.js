const fs=require('node:fs'),path=require('node:path'),root=path.resolve(process.argv[2]||'.');
const jp=path.join(root,'android/app/src/main/java/com/psmsawit/pantau/MainActivity.java'),wp=path.join(root,'www/index.html'),ap=path.join(root,'android/app/src/main/assets/index.html');
let j=fs.readFileSync(jp,'utf8');
if(!j.includes('PSM_ORGANIZED_STORAGE_V447')){
 j=j.replaceAll('saveBytesToDownloads(name,mime,b);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Download: "+name,Toast.LENGTH_LONG).show());','saveBytesToOrganizedStorage(name,mime,b);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Database APK Pantau PSM Sawit/"+folderForFile(name),Toast.LENGTH_LONG).show());');
 j=j.replaceAll('saveBytesToDownloads(name,safeMime(mime),bytes);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Download: "+name,Toast.LENGTH_LONG).show());','saveBytesToOrganizedStorage(name,safeMime(mime),bytes);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Database APK Pantau PSM Sawit/"+folderForFile(name),Toast.LENGTH_LONG).show());');
 j=j.replaceAll('saveBytesToDownloads(name,safeMime(mime),b);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Download: "+name,Toast.LENGTH_LONG).show());','saveBytesToOrganizedStorage(name,safeMime(mime),b);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Database APK Pantau PSM Sawit/"+folderForFile(name),Toast.LENGTH_LONG).show());');
 const m='    private void saveBytesToDownloads(String filename,String mime,byte[] bytes)throws Exception{';
 const code=`    // PSM_ORGANIZED_STORAGE_V447: public folders under shared internal storage/Documents.
    private String folderForFile(String filename){String n=(filename==null?"":filename).toLowerCase(Locale.ROOT);if(n.endsWith(".png")||n.endsWith(".jpg")||n.endsWith(".jpeg")||n.endsWith(".webp"))return(n.contains("nota")||n.contains("struk")?"Nota":"Gambar");if(n.endsWith(".json")||n.contains("backup"))return"Backup";if(n.endsWith(".pdf"))return"Laporan PDF";if(n.endsWith(".csv")||n.endsWith(".xls")||n.endsWith(".xlsx"))return"Export Excel";return"File Lainnya";}
    private void saveBytesToOrganizedStorage(String filename,String mime,byte[] bytes)throws Exception{String folder=folderForFile(filename);if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q){ContentValues v=new ContentValues();v.put(MediaStore.MediaColumns.DISPLAY_NAME,filename);v.put(MediaStore.MediaColumns.MIME_TYPE,mime);v.put(MediaStore.MediaColumns.RELATIVE_PATH,"Database APK Pantau PSM Sawit/"+folder+"/");v.put(MediaStore.MediaColumns.IS_PENDING,1);Uri uri=getContentResolver().insert(MediaStore.Files.getContentUri("external"),v);if(uri==null)throw new Exception("Tidak bisa membuat folder/file penyimpanan PSM");try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new Exception("OutputStream kosong");out.write(bytes);out.flush();ContentValues done=new ContentValues();done.put(MediaStore.MediaColumns.IS_PENDING,0);if(getContentResolver().update(uri,done,null,null)<=0)throw new Exception("Gagal menyelesaikan file");}catch(Exception e){getContentResolver().delete(uri,null,null);throw e;}}else{File base=Environment.getExternalStorageDirectory();File dir=new File(new File(base,"Database APK Pantau PSM Sawit"),folder);if(!dir.exists()&&!dir.mkdirs())throw new Exception("Folder penyimpanan PSM tidak dapat dibuat");try(FileOutputStream out=new FileOutputStream(new File(dir,filename))){out.write(bytes);out.flush();}}}
`;
 if(!j.includes(m))throw Error('save method not found');j=j.replace(m,code+m);fs.writeFileSync(jp,j);
}
let h=fs.readFileSync(wp,'utf8');if(!h.includes('PSM_ORGANIZED_DOWNLOAD_ROUTER_V447')){const s=`
<script id="psm-organized-download-router-v447">
/* PSM_ORGANIZED_DOWNLOAD_ROUTER_V447: route generated files into the app-specific folder tree. */
(function(){if(!window.Android||typeof window.Android.saveBase64File!=='function')return;
function route(a){if(!a||a.dataset.psmRouted==='1')return;a.dataset.psmRouted='1';const name=a.download||'PSM_FILE.bin',href=a.href||'';
const send=data=>{try{window.Android.saveBase64File(name,data)}catch(e){console.error('PSM file save failed',e)}};
if(href.startsWith('data:')){send(href);return}fetch(href).then(r=>{if(!r.ok)throw Error('File sementara tidak terbaca');return r.blob()}).then(b=>{const fr=new FileReader();fr.onload=()=>send(fr.result);fr.readAsDataURL(b)}).catch(e=>console.error(e))}
document.addEventListener('click',e=>{const a=e.target&&e.target.closest?e.target.closest('a[download]'):null;if(a&&/^(blob:|data:)/.test(a.href||'')){e.preventDefault();e.stopImmediatePropagation();route(a)}},true)})();
</script>`;
 if(h.includes('</body>'))h=h.replace('</body>',s+'\n</body>');else h+='\n'+s+'\n';fs.writeFileSync(wp,h);
}
// Always keep the Android WebView asset byte-for-byte synchronized with www.
fs.writeFileSync(ap,fs.readFileSync(wp,'utf8'));
const gp=path.join(root,'android/app/build.gradle');fs.writeFileSync(gp,fs.readFileSync(gp,'utf8').replace('versionCode 48','versionCode 49').replace("versionName '44.4.0'","versionName '44.7.0'"));
const pp=path.join(root,'package.json'),pkg=JSON.parse(fs.readFileSync(pp,'utf8'));pkg.version='44.7.0';fs.writeFileSync(pp,JSON.stringify(pkg,null,2)+'\n');
for(const f of fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.test.js'))){const p=path.join(root,'tests',f);let t=fs.readFileSync(p,'utf8').replaceAll('versionCode 48','versionCode 49').replaceAll('44\\.4\\.0','44\\.7\\.0').replaceAll("p.version,'44.4.0'","p.version,'44.7.0'");fs.writeFileSync(p,t)}
console.log('Organized storage v44.7.0 applied');

for(const file of fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.test.js'))){
 const p=path.join(root,'tests',file);
 let t=fs.readFileSync(p,'utf8');
 t=t.replaceAll('versionCode 48','versionCode 49').replaceAll('44\\.4.0','44\\.7.0').replaceAll("p.version,'44.4.0'","p.version,'44.7.0'");
 fs.writeFileSync(p,t);
}
