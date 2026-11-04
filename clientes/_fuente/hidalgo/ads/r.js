const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
 for(const n of ['1-emergencia','2-servicios','3-cobertura']){ await p.goto('file://'+__dirname+'/'+n+'.html'); await p.waitForTimeout(400); await p.screenshot({path:__dirname+'/'+n+'.png'}) }
 await b.close()})();
