import re
t=open('meca2.tpl.html',encoding='utf-8').read()
def rep(a,b,n=1):
    global t
    assert t.count(a)==n,(t.count(a),a[:90]); t=t.replace(a,b)
GEAR_SVG_RE=r'<svg viewBox="0 0 100 100" fill="currentColor"( aria-hidden="true")?><path d="M43\.3[^"]+"/></svg>'

# ---------- CSS ----------
rep('.logo svg{width:26px;height:26px;color:var(--purple3);animation:giro 14s linear infinite}',
    '.logo img{width:46px;height:46px;border-radius:50%;box-shadow:0 0 0 1px rgba(167,139,250,.35),0 0 24px -4px rgba(124,58,237,.7);transition:transform .6s var(--ease)}\n.logo:hover img{transform:rotate(-12deg) scale(1.06)}\n.nav.chico .logo img{width:38px;height:38px}')
rep('.intro svg{width:54px;height:54px;color:var(--purple3);animation:giro 1.6s linear infinite}',
    '.intro img{width:150px;height:150px;border-radius:50%;animation:latido 1.2s var(--ease) infinite alternate;box-shadow:0 0 60px -10px rgba(124,58,237,.9)}\n@keyframes latido{from{transform:scale(.94)}to{transform:scale(1.02)}}')
rep('.tarjeta img{width:100%;height:100%;object-fit:cover;',
    '.tarjeta img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;')
rep('.hero.listo .tarjeta img{transform:scale(1.07) translate3d(calc(var(--mx) * -14px),calc(var(--my) * -14px),0);transition:transform .2s linear}',
    '.hero.listo .tarjeta img{transform:scale(1.07) translate3d(calc(var(--mx) * -14px),calc(var(--my) * -14px),0);transition:transform .2s linear,opacity 1.4s var(--ease)}\n.tarjeta img.activa{opacity:1}\n.puntos{position:absolute;top:26px;right:28px;z-index:3;display:flex;gap:6px}\n.puntos i{width:22px;height:3px;border-radius:3px;background:rgba(255,255,255,.25);overflow:hidden;position:relative}\n.puntos i.on::after{content:\'\';position:absolute;inset:0;background:var(--lila);transform-origin:left;animation:barraDiapo 5s linear forwards}\n@keyframes barraDiapo{from{transform:scaleX(0)}to{transform:scaleX(1)}}')
rep('.pie-foto b{','.pie-foto b{transition:opacity .4s;')
# dueño: logo en vez de monograma
rep('.mono{width:78px;height:78px;border-radius:50%;display:grid;place-items:center;font-family:var(--f-titulo);font-size:2.2rem;background:conic-gradient(from 200deg,#c4b5fd,#7c3aed,#2e1065,#7c3aed,#c4b5fd);color:#fff;box-shadow:0 0 0 5px var(--bg3),0 0 0 6px var(--line2)}',
    '.mono{width:120px;height:120px;border-radius:50%;box-shadow:0 0 0 5px var(--bg3),0 0 0 6px var(--line2),0 0 50px -10px rgba(124,58,237,.8)}')
# Trabajos (bento) + visor
rep('/* Galería horizontal */','''/* Trabajos */
.bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:clamp(200px,22vw,290px);gap:14px}
.obra{position:relative;overflow:hidden;border-radius:22px;background:var(--bg3);cursor:zoom-in;border:0;padding:0;display:block;width:100%;height:100%;text-align:left;isolation:isolate}
.obra img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.15);transition:transform 1.2s var(--ease),filter .6s}
.obra.in img{transform:scale(1.01)}
.obra:hover img{transform:scale(1.08);filter:saturate(1.15)}
.obra::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(7,7,11,.92));transition:opacity .5s}
.obra::before{content:'';position:absolute;inset:0;z-index:3;background:var(--purple);transform-origin:top;transition:transform 1.1s var(--ease)}
.js .obra::before{transform:scaleY(1)}
.js .obra.in::before{transform:scaleY(0);transform-origin:bottom}
.obra figcaption{position:absolute;left:20px;right:20px;bottom:18px;z-index:2;display:flex;justify-content:space-between;align-items:end;gap:10px}
.obra small{display:block;font-family:var(--f-mono);font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:var(--lila)}
.obra b{display:block;font-family:var(--f-titulo);font-weight:400;font-size:clamp(1.5rem,2.2vw,2.1rem);line-height:1;color:#fff}
.obra .mas{width:38px;height:38px;flex:none;border-radius:50%;border:1px solid rgba(255,255,255,.3);display:grid;place-items:center;color:#fff;font-size:20px;line-height:1;transition:background .4s,transform .5s var(--ease)}
.obra:hover .mas{background:var(--purple);border-color:var(--purple);transform:rotate(90deg)}
.o-a{grid-column:1;grid-row:span 2}.o-b{grid-column:2 / 4}.o-c{grid-column:4;grid-row:span 2}.o-f{grid-column:1 / 4}
.dato-obra{border-radius:22px;padding:26px;background:linear-gradient(140deg,#8b5cf6,#5b21b6 60%,#2e1065);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;position:relative}
.dato-obra b{font-family:var(--f-titulo);font-weight:400;font-size:clamp(3.4rem,6vw,5.4rem);line-height:.85}
.dato-obra span{color:#ede9fe;font-size:.95rem}
.dato-obra a{color:#fff;font-weight:700;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;text-decoration:none}
@media(max-width:860px){
  .bento{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:clamp(170px,46vw,260px)}
  .o-a,.o-c{grid-column:auto;grid-row:span 2}.o-b,.o-f{grid-column:1 / 3;grid-row:auto}
  .dato-obra{grid-column:1 / 3}
}
dialog.visor{width:min(1100px,calc(100vw - 24px));max-height:calc(100svh - 24px);padding:0;border:0;background:transparent;color:var(--fg);margin:auto;overflow:visible}
dialog.visor::backdrop{background:rgba(5,5,8,.92);backdrop-filter:blur(8px)}
.visor-in{position:relative;display:grid;gap:12px;justify-items:center}
.visor img{max-width:100%;max-height:calc(100svh - 120px);border-radius:16px;object-fit:contain;box-shadow:0 40px 90px -30px rgba(0,0,0,.9)}
.visor p{font-family:var(--f-titulo);font-size:1.8rem;letter-spacing:.03em;text-align:center}
.visor-btn{position:absolute;top:50%;width:52px;height:52px;margin-top:-46px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(7,7,11,.6);color:#fff;font-size:24px;cursor:pointer;backdrop-filter:blur(8px);transition:background .3s}
.visor-btn:hover{background:var(--purple)}
.visor-ant{left:10px}.visor-sig{right:10px}
.visor-cerrar{position:absolute;top:-6px;right:-6px;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(7,7,11,.8);color:#fff;font-size:18px;cursor:pointer;z-index:2}

/* Galería horizontal */''')
rep('#taller{height:330vh;padding:0}','#taller{height:440vh;padding:0}')
rep('@media(max-width:760px){#taller{height:300vh}','@media(max-width:760px){#taller{height:420vh}')
# contacto: canales en vez de formulario
rep('.form{position:relative;isolation:isolate;overflow:hidden;background:rgba(19,19,29,.8);','''.canales{display:grid;gap:12px}
.canal{position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:56px minmax(0,1fr) 44px;gap:18px;align-items:center;padding:20px 22px;border:1px solid var(--line2);border-radius:20px;background:rgba(19,19,29,.8);text-decoration:none;transition:border-color .4s,transform .6s var(--ease)}
.canal:hover{border-color:rgba(167,139,250,.5);transform:translateX(6px)}
.canal .ic{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:rgba(124,58,237,.14);color:var(--purple3)}
.canal .ic svg{width:26px;height:26px}
.canal.wa .ic{background:#25d366;color:#fff}
.canal small{display:block;font-family:var(--f-mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--fg2)}
.canal b{display:block;font-family:var(--f-titulo);font-weight:400;font-size:clamp(1.6rem,2.6vw,2.1rem);line-height:1.05;letter-spacing:.02em;word-break:break-word}
.canal .fl{width:44px;height:44px;border-radius:50%;border:1px solid var(--line2);display:grid;place-items:center;font-size:18px;transition:background .4s,border-color .4s,transform .5s var(--ease)}
.canal:hover .fl{background:var(--purple);border-color:var(--purple);transform:rotate(-45deg)}
.canal.wa{background:linear-gradient(120deg,rgba(37,211,102,.14),rgba(19,19,29,.8) 60%);border-color:rgba(37,211,102,.35)}
@media(max-width:480px){.canal{grid-template-columns:48px minmax(0,1fr);padding:16px}.canal .fl{display:none}.canal .ic{width:48px;height:48px}}
.form{position:relative;isolation:isolate;overflow:hidden;background:rgba(19,19,29,.8);''')
rep('.pie-logo{font-family:var(--f-titulo);font-size:1.5rem;letter-spacing:.05em}','.pie-logo{display:flex;align-items:center;gap:14px;font-family:var(--f-titulo);font-size:1.5rem;letter-spacing:.05em}\n.pie-logo img{width:72px;height:72px;border-radius:50%}')

# ---------- HTML ----------
rep('<div class="intro" aria-hidden="true"><div class="intro-in">\n  ', '<div class="intro" aria-hidden="true"><div class="intro-in">\n  {{LOGO96IMG}}\n  <!--x-->')
t=re.sub(r'<!--x-->'+GEAR_SVG_RE+'\n','',t,count=1)
t=re.sub(r'(<a href="#inicio" class="logo"[^>]*>\n      )'+GEAR_SVG_RE, r'\1<img src="{{LOGO96}}" alt="" width="46" height="46">', t, count=1)
assert '{{LOGO96}}' in t and '{{LOGO96IMG}}' in t
t=t.replace('{{LOGO96IMG}}','<img src="{{LOGO512}}" alt="" width="150" height="150">')
rep('<li><a href="#servicios">Servicios</a></li>\n      <li><a href="#taller">Taller</a></li>','<li><a href="#servicios">Servicios</a></li>\n      <li><a href="#trabajos">Trabajos</a></li>\n      <li><a href="#taller">Taller</a></li>')
rep('</svg>Cotizar por WhatsApp</a>','</svg>Escribir por WhatsApp</a>')
rep('''        <img src="{{IMG0}}" alt="Cabezal Peterbilt rojo, cliente de MecaFusion J&amp;M" fetchpriority="high">
        <div class="mira" aria-hidden="true"></div>
        <div class="pie-foto"><div>Cliente<b>Peterbilt</b></div><span>Taras · Cartago</span></div>''',
'''        <img class="activa" src="{{IMG0}}" alt="Cabezal Peterbilt rojo, cliente de MecaFusion J&amp;M" data-marca="Peterbilt" fetchpriority="high">
        <img src="{{F:mack}}" alt="Camión Mack rojo, cliente de MecaFusion J&amp;M" data-marca="Mack">
        <img src="{{F:lonestar}}" alt="International LoneStar rojo, cliente de MecaFusion J&amp;M" data-marca="International">
        <img src="{{F:kenworth}}" alt="Volquete negro con frente cromado, cliente de MecaFusion J&amp;M" data-marca="Volquete">
        <div class="mira" aria-hidden="true"></div>
        <div class="puntos" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i></div>
        <div class="pie-foto"><div>Cliente<b id="fotoMarca">Peterbilt</b></div><span>Taras · Cartago</span></div>''')
# Sección trabajos antes de la galería
rep('<section id="taller" aria-label="Nuestro taller y clientes">','''<section id="trabajos" class="sec">
  <div class="container">
    <div class="cabeza">
      <div class="rv"><div class="etiqueta">Trabajos reales</div><h2 class="titulo">Así se trabaja<br><span class="grad">en el taller</span></h2></div>
      <p class="rv">Cambios de motor, reparación después de choques, plataformas, furgones y cisternas. Toque una foto para verla en grande.</p>
    </div>
    <div class="bento">
      <button type="button" class="obra o-a rv" data-titulo="Cambio de motor"><img src="{{F:motor}}" alt="Mecánico bajando un motor rojo con grúa hacia un cabezal" loading="lazy"><figcaption><div><small>Mecánica</small><b>Cambio de motor</b></div><span class="mas" aria-hidden="true">+</span></figcaption></button>
      <button type="button" class="obra o-b rv" data-titulo="Montaje de plataforma"><img src="{{F:plataforma}}" alt="Plataforma de grúa levantada con cadenas para montarla en el chasis" loading="lazy"><figcaption><div><small>Soldadura y montaje</small><b>Montaje de plataforma</b></div><span class="mas" aria-hidden="true">+</span></figcaption></button>
      <button type="button" class="obra o-c rv" data-titulo="Reparación después de un choque"><img src="{{F:choque}}" alt="Camión chocado levantado con grúa para reparar la cabina" loading="lazy"><figcaption><div><small>Estructura</small><b>Reparación tras choque</b></div><span class="mas" aria-hidden="true">+</span></figcaption></button>
      <button type="button" class="obra rv" data-titulo="Motor listo para montar"><img src="{{F:motor2}}" alt="Motor rojo colgando frente al compartimiento del motor abierto" loading="lazy"><figcaption><div><small>Mecánica</small><b>Motor al chasis</b></div><span class="mas" aria-hidden="true">+</span></figcaption></button>
      <button type="button" class="obra rv" data-titulo="Furgón en reparación"><img src="{{F:furgon}}" alt="Puerta trasera de un furgón levantada con grúa en el taller" loading="lazy"><figcaption><div><small>Furgones</small><b>Furgón</b></div><span class="mas" aria-hidden="true">+</span></figcaption></button>
      <button type="button" class="obra o-f rv" data-titulo="Cisterna terminada"><img src="{{F:cisterna1}}" alt="Cabezal Freightliner blanco con cisterna roja, amarilla y negra" loading="lazy"><figcaption><div><small>Trabajo terminado</small><b>Cabezal con cisterna</b></div><span class="mas" aria-hidden="true">+</span></figcaption></button>
      <div class="dato-obra rv"><b><span data-contar="400">400</span>+</b><span>trabajos entregados en camiones, carretas, lowboy, furgones y maquinaria.</span><a href="#contacto">Hablemos →</a></div>
    </div>
  </div>
</section>

<section id="taller" aria-label="Nuestro taller y clientes">''')
rep('''      <figure class="panel"><img src="{{IMG3}}" alt="Interior del taller con un camión en reparación" loading="lazy"><figcaption><div><small>El taller</small><b>Área de trabajo</b></div><em>03</em></figcaption></figure>''',
'''      <figure class="panel"><img src="{{IMG3}}" alt="Interior del taller con un camión en reparación" loading="lazy"><figcaption><div><small>El taller</small><b>Área de trabajo</b></div><em>03</em></figcaption></figure>
      <figure class="panel"><img src="{{F:cascadia}}" alt="Freightliner Cascadia verde y blanco, cliente de MecaFusion" loading="lazy"><figcaption><div><small>Cliente</small><b>Cascadia</b></div><em>04</em></figcaption></figure>
      <figure class="panel"><img src="{{F:amarilla}}" alt="Grúa plataforma Freightliner amarilla, cliente de MecaFusion" loading="lazy"><figcaption><div><small>Cliente</small><b>Grúa plataforma</b></div><em>05</em></figcaption></figure>
      <figure class="panel"><img src="{{F:cisterna2}}" alt="Cabezal blanco con cisterna en el patio del taller" loading="lazy"><figcaption><div><small>Trabajo terminado</small><b>Cisterna</b></div><em>06</em></figcaption></figure>''')
rep('<a href="#contacto" class="btn btn-borde">Pedir presupuesto</a>','<a href="#contacto" class="btn btn-borde">Contactar al taller</a>')
rep('<div class="mono" aria-hidden="true">JM</div>','<img class="mono" src="{{LOGO512}}" alt="Logo de MecaFusion J&amp;M" width="120" height="120" loading="lazy">')
# contacto
rep('<p>¿Máquina parada o necesita presupuesto? Escríbanos por WhatsApp o llámenos directamente. Respondemos rápido.</p>','<p>¿Máquina parada o necesita una revisión? Escríbanos o llámenos directamente y con gusto le atendemos.</p>')
rep('<div class="dato"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><div><small>Correo</small><b>mecafusionjm@gmail.com</b></div></div>',
    '<div class="dato"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><div><small>Correo</small><b>mecafusionjm@gmail.com</b></div></div>\n        <div class="dato"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg><div><small>Facturación</small><b>facturacionmecafusion@gmail.com</b></div></div>')
i=t.index('      <div class="acciones">\n        <a href="https://wa.me/50685957526" target'); j=t.index('</form>',i)+len('</form>')
WA='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>'
TEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'
MAIL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
FB='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5v3.3h2.8V22H14v-10.2h2.8l.4-3.3H14z"/></svg>'
canales='''    </div>
    <div class="canales rv">
      <a class="canal wa iman" href="https://wa.me/50685957526?text=Hola%2C%20vi%20su%20p%C3%A1gina%20web" target="_blank" rel="noopener noreferrer"><span class="ic" aria-hidden="true">%WA%</span><div><small>WhatsApp · Sinpe</small><b>8595-7526</b></div><span class="fl" aria-hidden="true">→</span></a>
      <a class="canal" href="tel:+50685957526"><span class="ic" aria-hidden="true">%TEL%</span><div><small>Llamar</small><b>8595-7526</b></div><span class="fl" aria-hidden="true">→</span></a>
      <a class="canal" href="tel:+50661269358"><span class="ic" aria-hidden="true">%TEL%</span><div><small>Teléfono</small><b>6126-9358</b></div><span class="fl" aria-hidden="true">→</span></a>
      <a class="canal" href="mailto:mecafusionjm@gmail.com"><span class="ic" aria-hidden="true">%MAIL%</span><div><small>Correo</small><b>mecafusionjm@gmail.com</b></div><span class="fl" aria-hidden="true">→</span></a>
      <a class="canal" href="https://www.facebook.com/p/Meca-Fusi%C3%B3n-JM-Taller-de-Mec%C3%A1nica-Pesada-100063808921138/" target="_blank" rel="noopener noreferrer"><span class="ic" aria-hidden="true">%FB%</span><div><small>Facebook</small><b>MecaFusión JM</b></div><span class="fl" aria-hidden="true">→</span></a>
    </div>'''.replace('%WA%',WA).replace('%TEL%',TEL).replace('%MAIL%',MAIL).replace('%FB%',FB)
t=t[:i]+canales+t[j:]
rep('<div><div class="pie-logo">MECA<span>FUSION</span> J&amp;M</div>','<div><div class="pie-logo"><img src="{{LOGO180}}" alt="" width="72" height="72" loading="lazy"><span>MECA<span>FUSION</span> J&amp;M</span></div>')
rep('.pie-logo span{color:var(--purple3)}','.pie-logo span span{color:var(--purple3)}')
rep('<li><a href="#servicios">Servicios</a></li><li><a href="#taller">Taller</a></li>','<li><a href="#servicios">Servicios</a></li><li><a href="#trabajos">Trabajos</a></li><li><a href="#taller">Taller</a></li>')
rep('{{LEGALES}}','''<dialog class="visor" id="visor" aria-label="Foto ampliada">
  <div class="visor-in">
    <button type="button" class="visor-cerrar" id="visorCerrar" aria-label="Cerrar">✕</button>
    <img id="visorImg" alt="">
    <button type="button" class="visor-btn visor-ant" id="visorAnt" aria-label="Foto anterior">‹</button>
    <button type="button" class="visor-btn visor-sig" id="visorSig" aria-label="Foto siguiente">›</button>
    <p id="visorTxt"></p>
  </div>
</dialog>

{{LEGALES}}''')
assert '<form' not in t
open('meca3.tpl.html','w',encoding='utf-8').write(t)
print('ok')
