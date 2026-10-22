import io,segno
t=open('gym.tpl.html',encoding='utf-8').read()
def rep(a,b,n=1):
    global t
    c=t.count(a); assert c==n,(c,a[:80]); t=t.replace(a,b)
rep('<title>Revolución Fitness · Gimnasio</title>','<title>Demo Gimnasio · Solanotech</title>')
rep('Gimnasio Revolución Fitness: pesas','Su gimnasio: pesas')
rep('Demo de ejemplo hecha por Solanotech para Revolución Fitness · precios, horarios y datos de muestra','Demo de Solanotech · aquí van el logo, los colores, las fotos y los precios de su gimnasio')
rep('<a class="logo" href="#inicio" aria-label="Revolución Fitness, inicio"><i><svg viewBox="0 0 20 24" fill="#0B0B0E" aria-hidden="true"><path d="M12 0L0 14h8l-2 10L20 9h-8z"/></svg></i><b>Revolución<small>Fitness</small></b></a>',
    '<a class="logo" href="#inicio" aria-label="Su gimnasio, inicio"><i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M3 12h18M6 8v8M9 6v12M15 6v12M18 8v8"/></svg></i><b>Tu Gym<small>Su logo aquí</small></b></a>')
rep('<div class="gigante" id="gigante">Revolución · Revolución ·</div>','<div class="gigante" id="gigante">Tu gimnasio · Tu gimnasio ·</div>')
rep('<b>Revolución Fitness</b></div></a>','<b>Su gimnasio</b></div></a>')
rep('<b>@revolucionfitness</b>','<b>@sugimnasio</b>',2)
rep('© <span id="anio">2026</span> Revolución Fitness','© <span id="anio">2026</span> Su gimnasio')
rep('<p class="nota">Precios de ejemplo para la demostración. En la página real se ponen los del gimnasio.</p>','<p class="nota">Precios de ejemplo. En su página van sus planes y precios reales.</p>')
rep('background:radial-gradient(closest-side,rgba(255,45,61,.22),transparent)','background:radial-gradient(closest-side,color-mix(in srgb,var(--rojo) 24%,transparent),transparent)')
rep('background:radial-gradient(circle at 35% 30%,#FF6B76,var(--rojo) 45%,#9E0F1C);box-shadow:0 40px 80px -30px rgba(255,45,61,.7)','background:radial-gradient(circle at 35% 30%,var(--rojo2),var(--rojo) 45%,color-mix(in srgb,var(--rojo) 55%,#000));box-shadow:0 40px 80px -30px color-mix(in srgb,var(--rojo) 70%,transparent)')
rep('background:linear-gradient(160deg,var(--rojo),#7A0B16);','background:linear-gradient(160deg,var(--rojo),color-mix(in srgb,var(--rojo) 50%,#000));')
rep('.plan.top{background:linear-gradient(170deg,#24070B,var(--negro) 60%);border-color:var(--rojo);box-shadow:0 30px 70px -40px rgba(255,45,61,.8)}','.plan.top{background:linear-gradient(170deg,color-mix(in srgb,var(--rojo) 18%,var(--negro)),var(--negro) 60%);border-color:var(--rojo);box-shadow:0 30px 70px -40px color-mix(in srgb,var(--rojo) 80%,transparent)}')
rep('filter:drop-shadow(0 0 8px rgba(215,255,58,.8))','filter:drop-shadow(0 0 8px var(--lima))')
rep('.clase:hover .num{color:#FFD7DB}','.clase:hover .num{color:rgba(255,255,255,.75)}')
rep('.clase:hover p{color:#FFE4E6}','.clase:hover p{color:rgba(255,255,255,.88)}')
rep('.clase:hover .nivel{color:#FFD7DB}','.clase:hover .nivel{color:rgba(255,255,255,.75)}')
rep('#qr .cab p{color:#2B3010}','#qr .cab p{color:color-mix(in srgb,var(--lima) 25%,#000)}')
rep('fill="#FF2D3D" transform','fill="currentColor" style="color:var(--rojo)" transform',2)
rep('\n/* aparición */\n','''
/* selector de colores para la demo */
.colores{position:fixed;left:16px;bottom:18px;z-index:85;display:flex;align-items:center;gap:8px;background:rgba(11,11,14,.88);backdrop-filter:blur(12px);border:1px solid var(--linea2);border-radius:999px;padding:8px 12px 8px 16px;box-shadow:0 18px 40px -16px rgba(0,0,0,.8)}
.colores span{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--gris);margin-right:2px}
.colores button{width:26px;height:26px;border-radius:50%;border:2px solid transparent;padding:0;background:linear-gradient(135deg,var(--a) 50%,var(--b) 50%);transition:transform .25s}
.colores button:hover{transform:scale(1.15)}
.colores button[aria-pressed="true"]{border-color:#fff;transform:scale(1.15)}
@media(max-width:600px){.colores{left:10px;right:84px;bottom:22px;justify-content:center;padding:7px 10px}.colores span{display:none}}

/* aparición */
''')
rep('<a class="fab" ','''<div class="colores" role="group" aria-label="Probar colores de la página"><span>Probá sus colores</span>
  <button type="button" style="--a:#FF2D3D;--b:#D7FF3A" data-c="#FF2D3D,#FF5A66,#D7FF3A" aria-pressed="true" aria-label="Rojo y lima"></button>
  <button type="button" style="--a:#C2189B;--b:#ECE8F0" data-c="#C2189B,#DA3DB5,#ECE8F0" aria-pressed="false" aria-label="Morado y gris"></button>
  <button type="button" style="--a:#1F6FE0;--b:#F7C51E" data-c="#1F6FE0,#4A8DF0,#F7C51E" aria-pressed="false" aria-label="Azul y amarillo"></button>
  <button type="button" style="--a:#FF7A1A;--b:#FFFFFF" data-c="#FF7A1A,#FF9B4D,#FFFFFF" aria-pressed="false" aria-label="Naranja y blanco"></button>
  <button type="button" style="--a:#14B86A;--b:#E8FF5A" data-c="#14B86A,#3DD68A,#E8FF5A" aria-pressed="false" aria-label="Verde y lima"></button>
</div>
<a class="fab" ''')
rep("  /* calculadora IMC */","""  /* colores de prueba */
  d.querySelectorAll('.colores button').forEach(function(b){ b.onclick=function(){
    var c=b.dataset.c.split(','), r=d.documentElement.style;
    r.setProperty('--rojo',c[0]); r.setProperty('--rojo2',c[1]); r.setProperty('--lima',c[2]);
    d.querySelectorAll('.colores button').forEach(function(x){ x.setAttribute('aria-pressed',x===b) });
  } });

  /* calculadora IMC */""")
def qr(url):
    b=io.BytesIO(); segno.make(url,error='m').save(b,kind='svg',scale=4,border=1,dark='#0B0B0E',xmldecl=False,svgns=True,omitsize=True); return b.getvalue().decode()
t=t.replace("p.textContent='₡'+Math.round(v/100)*100 .toLocaleString('es-CR').replace(/,/g,'.')","p.textContent='₡'+String(Math.round(v/100)*100).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.')")
t=t.replace('{{WA}}','https://wa.me/50689330326?text=Hola%2C%20vi%20la%20demo%20de%20gimnasio%20y%20quiero%20una%20p%C3%A1gina%20as%C3%AD')
t=t.replace('{{QR_RESENA}}',qr('https://ssolanotech.com')).replace('{{QR_WEB}}',qr('https://ssolanotech.com'))
for a,b2 in [('.hero h1{font-size:clamp(4.4rem,11vw,10rem);','.hero h1{font-size:clamp(3.8rem,8.2vw,8rem);'),('.cifra span{font-size:.72rem;','.cifra > span{font-size:.72rem;'),
  ('html{scroll-behavior:smooth;background:var(--negro)}','html{scroll-behavior:smooth;background:var(--negro);overflow-x:clip}'),('.logo b small{display:block;','.logo b small{display:block;margin-top:3px;'),
  ('.hero h1 .ln{display:block;overflow:hidden}','.hero h1 .ln{display:block;overflow:hidden;padding-top:.16em;margin-top:-.16em}')]:
    rep(a,b2)
assert '{{' not in t and 'Revoluci' not in t
open('/home/user/cloud-providers-demo/solanotech/demos/gimnasio/index.html','w',encoding='utf-8').write(t)
print(len(t))
