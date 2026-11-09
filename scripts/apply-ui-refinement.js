const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||'.');
const web=path.join(root,'www/index.html');
const android=path.join(root,'android/app/src/main/assets/index.html');
let html=fs.readFileSync(web,'utf8');
const css=[
'/* PSM Pantau UI refinement v44.5.0 — safe areas, readability and touch comfort */',
':root{--psm-green:#35a979;--psm-green-dark:#247c5a;--psm-green-soft:#eaf5ed;--psm-ink:#244638;--psm-muted:#718278;--psm-line:#dce8dc;--psm-radius:16px;--psm-safe-top:env(safe-area-inset-top,0px);--psm-safe-bottom:env(safe-area-inset-bottom,0px)}',
'html{min-height:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-behavior:smooth}',
'body{min-height:100%;overscroll-behavior-y:contain;-webkit-tap-highlight-color:transparent}',
'button,[role=button],input,select,textarea{font:inherit}',
'button,[role=button]{touch-action:manipulation}',
'input,select,textarea{max-width:100%;box-sizing:border-box}',
'input:not([type=checkbox]):not([type=radio]),select,textarea{min-height:46px;border-radius:12px;line-height:1.35}',
'input:focus,select:focus,textarea:focus,button:focus-visible,[role=button]:focus-visible{outline:2px solid rgba(53,169,121,.55);outline-offset:2px}',
'button{min-height:42px;border-radius:12px;transition:filter .14s ease,transform .14s ease}',
'button:active,[role=button]:active{filter:brightness(.96)}',
'label{line-height:1.35}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:separate;border-spacing:0}th,td{vertical-align:middle}',
'.modal,.modal-content,[role=dialog],.settings-modal,.settings-content{box-sizing:border-box;overscroll-behavior:contain}',
'.modal,.settings-modal,[role=dialog]{max-height:calc(100dvh - var(--psm-safe-top) - var(--psm-safe-bottom) - 16px)}',
'.modal-content,.settings-content{max-height:calc(100dvh - var(--psm-safe-top) - var(--psm-safe-bottom) - 36px);overflow-y:auto;-webkit-overflow-scrolling:touch}',
'@media(max-width:480px){.modal,.settings-modal,[role=dialog]{max-width:calc(100vw - 20px)}input:not([type=checkbox]):not([type=radio]),select,textarea{font-size:16px}}',
'@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
].join('\n');
if(!html.includes('PSM Pantau UI refinement v44.5.0')){
 if(!html.includes('</head>'))throw Error('Head HTML tidak ditemukan');
 html=html.replace('</head>','<style id="psm-ui-refinement-v445">'+css+'</style>\n</head>');
}
if(!/name=["']viewport["']/.test(html))html=html.replace('<head>','<head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">');
fs.writeFileSync(web,html);fs.writeFileSync(android,html);
const main=path.join(root,'android/app/src/main/java/com/psmsawit/pantau/MainActivity.java');
if(fs.existsSync(main)){
 let java=fs.readFileSync(main,'utf8');
 if(!java.includes('PSM_STATUS_BAR_INSETS_V445')){
  const marker='super.onCreate(savedInstanceState);';
  if(!java.includes(marker))throw Error('MainActivity onCreate marker not found');
  const nativeCode=[
   marker,
   '        // PSM_STATUS_BAR_INSETS_V445: keep system bars outside WebView content.',
   '        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {',
   '            getWindow().setStatusBarColor(android.graphics.Color.rgb(53, 169, 121));',
   '            getWindow().setNavigationBarColor(android.graphics.Color.rgb(243, 248, 241));',
   '        }',
   '        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {',
   '            getWindow().getDecorView().setSystemUiVisibility(getWindow().getDecorView().getSystemUiVisibility() | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);',
   '        }',
   '        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {',
   '            getWindow().getDecorView().setSystemUiVisibility(getWindow().getDecorView().getSystemUiVisibility() & ~android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN & ~android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION & ~android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE);',
   '        }'
  ].join('\n');
  java=java.replace(marker,nativeCode);fs.writeFileSync(main,java);
 }
}
console.log('UI refinement applied.');
