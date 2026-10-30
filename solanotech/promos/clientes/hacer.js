const { chromium } = require('playwright'); const fs=require('fs'), crypto=require('crypto'), GF=__dirname+'/../gf2/', D=__dirname+'/';
const POSTS=[
 {f:'01-clientes-satisfechos', d:{collage:true, titulo:'Clientes que<br><span>ya confiaron</span>', items:[
   {img:'gruas-mario-pc.png',nom:'Grúas Mario'},{img:'gruas-dieca-pc.png',nom:'Grúas Dieca S.A.'},{img:'adriana-bonos-pc.png',nom:'Adriana Solano · Bonos'},{img:'mecafusion-pc.png',nom:'MecaFusión J&M'}]}},
 {f:'02-gruas-mario', d:{titulo:'Grúas<br><span>Mario</span>', tipo:'Servicio de <b>grúa de plataforma 24/7</b>', pc:'gruas-mario-pc.png', cel:'gruas-mario-cel.png', chips:['Botón de WhatsApp','QR de reseñas Google','Cotizador','Adaptada al celular']}},
 {f:'03-gruas-dieca', d:{titulo:'Grúas<br><span>Dieca S.A.</span>', tipo:'<b>Grúa telescópica</b> y transporte pesado', pc:'gruas-dieca-pc.png', cel:'gruas-dieca-cel.png', chips:['Cotización por WhatsApp','Generador de proformas PDF','Galería de trabajos','Seguridad incluida']}},
 {f:'04-adriana-bonos', d:{titulo:'Adriana<br><span>Solano</span>', tipo:'Asesoría en <b>bonos de vivienda</b>', pc:'adriana-bonos-pc.png', cel:'adriana-bonos-cel.png', chips:['Solicitud en PDF','Diseños de casas','Requisitos claros','Adaptada al celular']}},
 {f:'05-mecafusion', d:{titulo:'MecaFusión<br><span>J&amp;M</span>', tipo:'Taller de <b>mecánica pesada</b> y soldadura', pc:'mecafusion-pc.png', cel:'mecafusion-cel.png', chips:['Animación del camión','Galería de trabajos','Logo y colores propios','Adaptada al celular']}}
];
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const P of POSTS){ const p=await b.newPage({viewport:{width:1080,height:1350}});
  await p.route(/fonts\.googleapis\.com/, r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(GF+'fonts.css','utf8')}));
  await p.route(/fonts\.gstatic\.com/, r=>{ const k=crypto.createHash('md5').update(r.request().url()+'\n').digest('hex').slice(0,12); r.fulfill({contentType:'font/woff2',body:fs.readFileSync(GF+k+'.woff2')}); });
  await p.goto('file://'+D+'post.html'); await p.evaluate(d=>window.pinta(d),P.d);
  await p.evaluate(()=>Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>0))])); await p.waitForTimeout(300);
  await p.screenshot({path:D+P.f+'.png'}); await p.close(); }
 await b.close(); })();
