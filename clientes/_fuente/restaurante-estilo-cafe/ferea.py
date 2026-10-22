import sys
CSS=open('/tmp/claude-0/-home-user-cloud-providers-demo/85d304cc-16a2-5927-a034-75b90352da3b/scratchpad/rest/ferea.css',encoding='utf-8').read()
TAZA='''<svg class="sticker-taza" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 46h56v8a28 28 0 0 1-56 0z" fill="#FFFDF8"/><path d="M74 52h6a9 9 0 0 1 0 18h-9"/><path d="M10 86h76"/><path d="M34 34c-4-6 4-10 0-16M48 34c-4-6 4-10 0-16M62 34c-4-6 4-10 0-16"/><path d="M26 56h40M30 64h32" stroke-width="2.5"/></svg>'''
ESTAMPILLA='''<svg class="estampilla" viewBox="0 0 120 120" aria-hidden="true"><path d="M10 10h100v100H10z" fill="#FFFDF8" stroke="currentColor" stroke-width="3" stroke-dasharray="6 5"/><rect x="22" y="22" width="76" height="76" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M46 36v22a6 6 0 0 0 6 6v20M40 36v14M52 36v14"/><path d="M74 84V36c-8 4-10 16-10 24h10"/></g><path d="M30 30l6 6M90 30l-6 6M30 90l6-6M90 90l-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'''
HOJA='''<svg class="st s1" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 66C10 34 30 14 66 12c2 34-18 56-52 54z" fill="rgba(255,248,238,.25)"/><path d="M14 66L50 30M30 50h14M38 42V30"/></svg>'''
OLLA='''<svg class="st s2" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 40h62v14a24 24 0 0 1-24 24H38a24 24 0 0 1-24-24z" fill="rgba(255,248,238,.25)"/><path d="M8 42h8M74 42h8M36 40v-6h18v6M32 26c-3-5 3-8 0-13M46 26c-3-5 3-8 0-13M60 26c-3-5 3-8 0-13"/></svg>'''

def rep(t,a,b,n=1):
    assert t.count(a)==n,(t.count(a),a[:80]); return t.replace(a,b)

for path in sys.argv[1:]:
    t=open(path,encoding='utf-8').read()
    t=rep(t,'family=Instrument+Serif:ital@0;1&family=Karla:wght@400;500;700&display=swap','family=Anton&family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap')
    t=rep(t,'<meta name="theme-color" content="#05070C">','<meta name="theme-color" content="#2A1A0F">')
    t=rep(t,'</style>\n</head>',CSS+'</style>\n</head>')
    # portada
    a=t.index('      <p class="ojo">Cartago · Costa Rica</p>'); b=t.index('      <div class="cta">',a)
    t=t[:a]+'''      <div class="h-titulo">
        <span class="sticker-r" aria-hidden="true">Hecho<br>con leña</span>
        <h1 id="h1hero"><span class="h-grande">Sabor de</span><span class="h-tag">casa</span></h1>
        '''+TAZA+'''
      </div>
      <p class="h-hoy">Hoy en el fogón · <span class="rota" id="rota"><b>Olla de carne</b></span></p>
      <h4 class="h-sub">Nuestra historia</h4>
      <p class="lede">Quince minutos de la Basílica. Cocinamos con fuego de verdad, compramos en la feria los sábados y el café nos llega de Tarrazú.</p>
'''+t[b:]
    # franja nosotros
    t=rep(t,'<div class="cinta"><div class="rueda" id="rueda"></div></div>\n','''<div class="cinta"><div class="rueda" id="rueda"></div></div>

<!-- ================= NOSOTROS ================= -->
<section class="nos" id="nosotros">'''+HOJA+OLLA+'''<div class="wrap">
  <p class="ojo">Nosotros</p>
  <h2>Más que <em>comida</em>,<br>una casa</h2>
  <p class="txt" id="nosDesc"></p>
</div></section>
''')
    # encabezado del menú
    t=rep(t,'''  <div class="cab rv">
    <div><p class="ojo">La carta</p><h2>Nuestro menú</h2></div>
    <p>Precios en colones, impuestos incluidos. Si algo se acaba en el día, lo quitamos del menú al instante.</p>
  </div>''','''  <div class="cab rv">
    <div><p class="ojo">Nuestro menú</p><h2>Para todos<br>los días</h2>
      <p style="margin-top:14px">Precios en colones, impuestos incluidos. Si algo se acaba en el día, lo quitamos del menú al instante.</p></div>
    <a class="btn btn-p" href="#menu" id="verTodo">Ver todo el menú</a>
  </div>''')
    t=rep(t,'  <div id="cartaMenu"></div>\n','  <div id="cartaMenu"></div>\n  '+ESTAMPILLA+'\n')
    # datos: color de marca café
    t=rep(t,'acento:"#1A4FD8"','acento:"#B5772C"')
    # tarjetas del menú
    a=t.index('  document.getElementById("cartaMenu").innerHTML = muestra.map(c=>{'); b=t.index('  document.querySelectorAll(".pill").forEach(b=>b.onclick',a)
    t=t[:a]+'''  const num = String(S.r.whatsapp).replace(/\\D/g,"");
  const pedir = d => `https://wa.me/${num}?text=${encodeURIComponent("Hola, quiero pedir: "+d.n+" ("+col(d.p)+")")}`;
  document.getElementById("cartaMenu").innerHTML = muestra.map(c=>{
    const items = S.d.filter(d=>d.cat===c && d.v);
    return `<div class="cat-bloque">
      <div class="cat-cab rv">
        <h3>${esc(c)}</h3><span class="cat-n num">${items.length} ${items.length===1?"platillo":"platillos"}</span>
        <div class="flechas"><button type="button" data-dir="-1" aria-label="Anteriores">‹</button><button type="button" data-dir="1" aria-label="Siguientes">›</button></div>
      </div>
      <div class="riel">${items.map((d,i)=>`
        <article class="plato rv" style="transition-delay:${Math.min(i,3)*80}ms">
          <div class="p-top"><h4>${esc(d.n)}</h4><a class="pedir" href="${pedir(d)}" target="_blank" rel="noopener">Pedir +</a></div>
          <div class="foto">${svgFor(d.art)}${d.b?`<span class="eti">${esc(d.b)}</span>`:""}${F.tres_d && RECETAS[claveReceta(d)]?'<span class="ver3d">Ver en 3D</span>':''}</div>
          <p class="p-desc">${esc(d.x)}</p>
          <div class="p-pie"><span>Precio:</span><span class="precio">${col(d.p)}</span></div>
        </article>`).join("")}</div>
      <div class="puntos"></div></div>`;
  }).join("");
  document.querySelectorAll("#cartaMenu .cat-bloque").forEach(bl=>{
    const riel = bl.querySelector(".riel"), pts = bl.querySelector(".puntos"), fl = bl.querySelectorAll(".flechas button");
    const cards = [...riel.children];
    const marca = ()=>{
      const w = cards[0] ? cards[0].offsetWidth : 1, vis = Math.max(1, Math.round(riel.clientWidth / w));
      const pags = Math.max(1, cards.length - vis + 1), act = Math.min(pags-1, Math.round(riel.scrollLeft / w));
      if(pts.children.length !== pags){
        pts.innerHTML = pags > 1 ? Array.from({length:pags},(_,i)=>`<button type="button" aria-label="Ir al ${i+1}"></button>`).join("") : "";
        [...pts.children].forEach((p,i)=>p.onclick=()=>riel.scrollTo({left:i*w}));
      }
      [...pts.children].forEach((p,i)=>p.setAttribute("aria-current", i===act));
      fl[0].disabled = act <= 0; fl[1].disabled = act >= pags-1;
      bl.querySelector(".flechas").style.display = pags > 1 ? "" : "none";
    };
    fl.forEach(f=>f.onclick=()=>riel.scrollBy({left:(+f.dataset.dir)*(cards[0]?cards[0].offsetWidth:300)}));
    riel.addEventListener("scroll", ()=>requestAnimationFrame(marca), {passive:true});
    addEventListener("resize", marca);
    marca();
  });
  const vt = document.getElementById("verTodo");
  if(vt) vt.onclick = e=>{ e.preventDefault(); filtro = "Todo"; pintaMenu(); document.getElementById("menu").scrollIntoView({behavior:"smooth",block:"start"}); };
'''+t[b:]
    t=rep(t,'''    if(t) el.addEventListener("click", ()=>{''','''    if(t) el.addEventListener("click", ev=>{
      if(ev.target.closest(".pedir")) return;''')
    # hero sin 3D: plato recortado flotando
    t=rep(t,'''    `<div class="heroart">${svgFor(destacado.art)}<span class="tag">${esc(destacado.n)}</span></div>`;''',
'''    `<div class="heroart corte"><span class="disco"></span>${svgFor(destacado.art)}${(()=>{ const m = S.d.find(d=>d.v && d.cat==="Bebidas" && d.art && d.art.foto); return m ? `<span class="mini">${svgFor(m.art)}</span>` : ""; })()}<span class="tag">${esc(destacado.n)}</span></div>`;''')
    # descripción en la franja nosotros
    t=rep(t,'  document.getElementById("pieNombre").textContent = r.nombre;','  document.getElementById("pieNombre").textContent = r.nombre;\n  const nd = document.getElementById("nosDesc"); if(nd) nd.textContent = r.desc || "";')
    t=rep(t,'background:linear-gradient(160deg,var(--azul),#1B3FA8);border-color:transparent','background:linear-gradient(160deg,var(--azul),#5E3418);border-color:transparent')
    t=rep(t,'<p style="color:#D8E3FF">','<p style="color:#FFF1DD">')
    t=rep(t,'document.querySelectorAll(".plato, .panel").forEach(c=>{','document.querySelectorAll(".panel").forEach(c=>{')
    t=rep(t,'const frases = ["Cocina de montaña","Horno de leña","Feria de Cartago","Café de Tarrazú","Desde 1998","Hecho a mano"];','const frases = ["Cocina de montaña","Horno de leña","Feria de Cartago","Café de Tarrazú","Desde 1998","Hecho a mano","Sabor de casa"];')
    t=rep(t,'document.querySelectorAll(".cab h2, .horiz h2, .paso h3").forEach(partir);','document.querySelectorAll(".cab h2, .horiz h2, .paso h3, .nos h2").forEach(partir);')
    t=rep(t,'document.querySelectorAll(".cab h2, .horiz h2").forEach(e=>ioTexto.observe(e));','document.querySelectorAll(".cab h2, .horiz h2, .nos h2").forEach(e=>ioTexto.observe(e));')
    open(path,'w',encoding='utf-8').write(t)
    print('ok',path,len(t))
