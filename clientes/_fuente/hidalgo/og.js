const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});
 const bg='data:image/webp;base64,'+fs.readFileSync(__dirname+'/img/noche.webp').toString('base64');
 const lg='data:image/png;base64,'+fs.readFileSync('/home/user/cloud-providers-demo/clientes/gruas-hidalgo/logo/logo-color.png').toString('base64');
 await p.setContent(`<body style="margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:Arial Narrow,Arial,sans-serif;background:#0A0E1A">
 <img src="${bg}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:40% 50%">
 <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,14,26,.95) 0%,rgba(10,14,26,.75) 50%,rgba(10,14,26,.2) 100%)"></div>
 <div style="position:absolute;left:64px;top:70px;color:#fff;width:640px">
  <div style="display:inline-block;background:#2EE07A;color:#06301A;font-weight:800;font-size:26px;padding:8px 18px;border-radius:999px;letter-spacing:.06em">24 HORAS · 7 DÍAS</div>
  <div style="font-weight:900;font-style:italic;font-size:92px;line-height:.92;margin-top:26px;text-transform:uppercase">Grúa para<br><span style="color:#8C9CFF">camiones<br>pesados</span></div>
  <div style="font-size:30px;margin-top:24px;color:#E9ECF1;font-weight:700">Todo Costa Rica · WhatsApp 8838-1397</div></div>
 <img src="${lg}" style="position:absolute;right:56px;top:95px;width:420px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.6))"></body>`);
 await p.waitForTimeout(300); await p.screenshot({path:__dirname+'/img/og.jpg',type:'jpeg',quality:86}); await b.close()})();
