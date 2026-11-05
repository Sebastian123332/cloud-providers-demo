const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(); const out={};
 for(const pg of ['/','/tarjeta.html#registro','/panel.html']){
  const p=await b.newPage(); const ext=[],errs=[];
  p.on('request',r=>{ if(!r.url().startsWith('http://localhost:8790')&&!/^(data|blob):/.test(r.url())) ext.push(r.url()) });
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()) });
  await p.addInitScript(()=>{ window.__csp=[]; document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI)) });
  await p.goto('http://localhost:8790'+pg); await p.waitForTimeout(1500);
  out[pg]=await p.evaluate(async()=>{ await document.fonts.ready; return {fuentes:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i), csp:window.__csp} });
  out[pg].externas=ext; out[pg].errores=errs; await p.close() }
 console.log(JSON.stringify(out,null,1)); await b.close()})();
