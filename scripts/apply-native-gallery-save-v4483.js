const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.');
const file=path.join(root,'android/app/src/main/java/com/psmsawit/pantau/MainActivity.java');
let s=fs.readFileSync(file,'utf8');
if(!s.includes('saveBytesToDownloads('))throw Error('Native Downloads writer missing');
if(!s.includes('private void saveImageToGallery(')){
 const marker='    private void saveBytesToDownloads(';
 const method=`    private void saveImageToGallery(String filename,String mime,byte[] bytes)throws Exception{
        if(mime==null||!mime.startsWith("image/")){saveBytesToDownloads(filename,mime,bytes);return;}
        if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q){
            ContentValues values=new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME,filename);
            values.put(MediaStore.Images.Media.MIME_TYPE,mime);
            values.put(MediaStore.Images.Media.RELATIVE_PATH,Environment.DIRECTORY_PICTURES+"/PSM SAWIT");
            values.put(MediaStore.Images.Media.IS_PENDING,1);
            Uri uri=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);
            if(uri==null)throw new Exception("Android tidak dapat membuat gambar di Galeri");
            try{
                try(OutputStream out=getContentResolver().openOutputStream(uri,"w")){
                    if(out==null)throw new Exception("Akses tulis Galeri tidak tersedia");
                    out.write(bytes);out.flush();
                }
                ContentValues done=new ContentValues();done.put(MediaStore.Images.Media.IS_PENDING,0);
                if(getContentResolver().update(uri,done,null,null)<=0)throw new Exception("Gagal menyelesaikan penyimpanan gambar");
            }catch(Exception e){getContentResolver().delete(uri,null,null);throw e;}
        }else{
            File dir=new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),"PSM SAWIT");
            if(!dir.exists()&&!dir.mkdirs())throw new Exception("Folder Pictures/PSM SAWIT tidak dapat dibuat");
            File target=new File(dir,filename);
            try(FileOutputStream out=new FileOutputStream(target)){out.write(bytes);out.flush();}
            android.media.MediaScannerConnection.scanFile(this,new String[]{target.getAbsolutePath()},new String[]{mime},null);
        }
    }
`;
 if(!s.includes(marker))throw Error('Native Downloads method insertion point missing');
 s=s.replace(marker,method+marker);
}
s=s.replace('saveBytesToDownloads(name,mime,b);','saveImageToGallery(name,mime,b);');
s=s.replace('saveBytesToDownloads(name,safeMime(mime),bytes);','saveImageToGallery(name,safeMime(mime),bytes);');\ns=s.replace('saveBytesToDownloads(name,safeMime(mime),b);','saveImageToGallery(name,safeMime(mime),b);');
s=s.replace('saveBytesToDownloads(name,safeMime(mime),b);','saveImageToGallery(name,safeMime(mime),b);');
if(!s.includes('private void saveImageToGallery(')||!s.includes('MediaStore.Images.Media.EXTERNAL_CONTENT_URI')||s.includes('saveBytesToDownloads(name,'))throw Error('Gallery save bridge verification failed');
fs.writeFileSync(file,s);
const pf=path.join(root,'package.json'),p=JSON.parse(fs.readFileSync(pf,'utf8'));p.version='44.8.3';fs.writeFileSync(pf,JSON.stringify(p,null,2)+'\n');
const gf=path.join(root,'android/app/build.gradle');let g=fs.readFileSync(gf,'utf8').replace(/versionCode\s+\d+/,'versionCode 53').replace(/versionName ['"]44\.8\.2['"]/, "versionName '44.8.3'");fs.writeFileSync(gf,g);