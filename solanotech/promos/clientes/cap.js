const { chromium } = require('playwright'); const fs=require('fs'), crypto=require('crypto'), {execFileSync}=require('child_process');
const C=__dirname+'/cache/'; fs.mkdirSync(C,{recursive:true});
function bajar(url){ const k=crypto.createHash('md5').update(url).digest('hex'); const f=C+k;
  if(!fs.existsSync(f)) execFileSync('curl',['-sS','-A','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36','-o',f,url]); return fs.readFileSync(f); }
const SITIOS=['gruas-mario','gruas-dieca','adriana-bonos','mecafusion'];
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const s of SITIOS) for (const [w,h,n] of [[1440,900,'pc'],[390,844,'cel']]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2}); const p=await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{ const u=r.request().url(); r.fulfill({contentType:u.includes('googleapis')?'text/css':'font/woff2', body:bajar(u)}) });
  await p.route(/cdnjs/, r=>r.abort());
  await p.goto('file:///home/user/cloud-providers-demo/clientes/'+s+'/index.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(3200);
  
  await p.screenshot({path:__dirname+`/${s}-${n}.png`}); await ctx.close(); }
 await b.close(); })();
