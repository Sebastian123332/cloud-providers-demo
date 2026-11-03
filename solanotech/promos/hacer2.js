const { chromium } = require('playwright'); const fs=require('fs'), crypto=require('crypto'), GF=__dirname+'/../gf2/', D=__dirname+'/';
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const [tpl,h,hist,out] of [['g',1350,0,'solanotech-web-post'],['g',1920,1,'solanotech-web-historia'],['bn',1350,0,'black-november-post'],['bn',1920,1,'black-november-historia']]) {
  const p=await b.newPage({viewport:{width:1080,height:h}});
  await p.route(/fonts\.googleapis\.com/, r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(GF+'fonts.css','utf8')}));
  await p.route(/fonts\.gstatic\.com/, r=>{ const k=crypto.createHash('md5').update(r.request().url()+'\n').digest('hex').slice(0,12); r.fulfill({contentType:'font/woff2',body:fs.readFileSync(GF+k+'.woff2')}); });
  await p.goto('file://'+D+'promo2.html');
  await p.evaluate(([t,h,hi])=>{ document.body.style.setProperty('--h',h+'px'); if(hi) document.body.classList.add('hist'); if(t==='bn') document.body.classList.add('bn'); document.getElementById('raiz').appendChild(document.getElementById('tpl-'+t).content.cloneNode(true)) },[tpl,h,hist]);
  await p.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>0))])); await p.waitForTimeout(300);
  await p.screenshot({path:D+out+'.png'}); await p.close(); }
 await b.close(); })();
