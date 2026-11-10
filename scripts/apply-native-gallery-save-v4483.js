const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.');
const file=path.join(root,'android/app/src/main/java/com/psmsawit/pantau/MainActivity.java');
let s=fs.readFileSync(file,'utf8');
if(!s.includes('private void saveBytesToDownloads('))throw Error('Native file save method not found');
if(!s.includes('PSM_IMAGE_MEDIastore_V443')) {
 s=s.replace('saveBytesToDownloads(name,mime,b);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Download: "+name,Toast.LENGTH_LONG).show());','saveImageToGallery(name,mime,b);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"Gambar tersimpan di Galeri: Pictures/PSM SAWIT/"+name,Toast.LENGTH_LONG).show());');
 s=s.replace('saveBytesToDownloads(name,safeMime(mime),bytes);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"File tersimpan di Download: "+name,Toast.LENGTH_LONG).show());','saveImageToGallery(name,safeMime(mime),bytes);runOnUiThread(()->Toast.makeText(MainActivity.this.getApplicationContext(),"Gambar tersimpan di Galeri: Pictures/PSM SAWIT/"+name,Toast.LENGTH_LONG).show());');
 const marker='    private void saveBytesToDownloads(';
 const method='    private void saveImageToGallery(String filename,String mime,byte[] bytes)throws Exception{\n'+
 '        if(!mime.startsWith("image/")){saveBytesToDownloads(filename,mime,bytes);return;}\n'+
 '        if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q){\n'+
 '            ContentValues values=new ContentValues();\n'+
 '            values.put(MediaStore.Images.Media.DISPLAY_NAME,filename);\n'+
 '            values.put(MediaStore.Images.Media.MIME_TYPE,mime);\n'+
 '            values.put(MediaStore.Images.Media.RELATIVE_PATH,Environment.DIRECTORY_PICTURES+"/PSM SAWIT");\n'+
 '            values.put(MediaStore.Images.Media.IS_PENDING,1);\n'+
 '            Uri uri=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);\n'+
 '            if(uri==null)throw new Exception("Android tidak dapat membuat gambar di Galeri");\n'+
 '            try{try(OutputStream out=getContentResolver().openOutputStream(uri,"w")){if(out==null)throw new Exception("Akses tulis Galeri tidak tersedia");out.write(bytes);out.flush();}\n'+
 '                ContentValues done=new ContentValues();done.put(MediaStore.Images.Media.IS_PENDING,0);\n'+
 '                if(getContentResolver().update(uri,done,null,null)<=0)throw new Exception("Gagal menyelesaikan penyimpanan gambar");\n'+
 '            }catch(Exception e){getContentResolver().delete(uri,null,null);throw e;}\n'+
 '        }else{File dir=new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),"PSM SAWIT");if(!dir.exists()&&!dir.mkdirs())throw new Exception("Folder Pictures/PSM SAWIT tidak dapat dibuat");File target=new File(dir,filename);try(FileOutputStream out=new FileOutputStream(target)){out.write(bytes);out.flush();}android.media.MediaScannerConnection.scanFile(this,new String[]{target.getAbsolutePath()},new String[]{mime},null);}\n'+
 '    }\n';
 if(!s.includes(marker))throw Error('Save method insertion point missing');s=s.replace(marker,method+marker);
}
if(!s.includes('saveImageToGallery(name,mime,b)')||!s.includes('MediaStore.Images.Media.EXTERNAL_CONTENT_URI'))throw Error('Image gallery patch verification failed');fs.writeFileSync(file,s);
const pf=path.join(root,'package.json'),p=JSON.parse(fs.readFileSync(pf,'utf8'));p.version='44.8.3';fs.writeFileSync(pf,JSON.stringify(p,null,2)+'\n');
const gf=path.join(root,'android/app/build.gradle');let g=fs.readFileSync(gf,'utf8').replace(/versionCode\s+\d+/,'versionCode 53').replace(/versionName ['"]44\.8\.2['"]/,"versionName '44.8.3'");fs.writeFileSync(gf,g);
