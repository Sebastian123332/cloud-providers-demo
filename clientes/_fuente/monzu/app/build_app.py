"""Arma la app de Monzú (página + reservas + Monzú Club + panel) en clientes/monzu-app/public.

Toma la página de muestra (monzu.tpl.html + monzu.js), le cambia el agendado por reservas reales
con horario, agrega la sección Monzú Club, y genera tarjeta.html y panel.html.
Uso: python3 build_app.py [carpeta_destino]
"""
import base64, hashlib, io, json, os, re, shutil, sys
import segno
from PIL import Image

A = os.path.dirname(os.path.abspath(__file__)) + '/'
M = A + '../'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(A + '../../../monzu-app/public')
FECHA = '5 de noviembre de 2026'
os.makedirs(OUT + '/js', exist_ok=True)

def uri(f, m): return 'data:%s;base64,%s' % (m, base64.b64encode(open(M + 'img/' + f, 'rb').read()).decode())
h = lambda x: "'sha256-" + base64.b64encode(hashlib.sha256(x.encode()).digest()).decode() + "'"

def rep(t, a, b, n=1):
    c = t.count(a); assert c == n, (c, a[:90]); return t.replace(a, b)

def csp_de(t, extra_script="", connect="'self'", img="'self' data:"):
    est = re.findall(r'<style>(.*?)</style>', t, re.S); scr = re.findall(r'<script>(.*?)</script>', t, re.S)
    assert len(scr) == 1, len(scr)
    return "; ".join(["default-src 'none'", "script-src " + h(scr[0]) + extra_script, "style-src " + " ".join(h(e) for e in est) + " https://fonts.googleapis.com",
                      "font-src https://fonts.gstatic.com", "img-src " + img, "connect-src " + connect, "manifest-src 'self'", "form-action 'none'", "base-uri 'none'",
                      "object-src 'none'", "require-trusted-types-for 'script'", "trusted-types 'none'", "frame-ancestors 'none'", "upgrade-insecure-requests"])

def con_csp(t, csp):
    return t.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + csp.replace("; frame-ancestors 'none'", '') + '">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n', 1)

# ---------------- íconos y manifiestos ----------------
logo = Image.open(M + 'img/logo_t.png').convert('RGBA')
for tam in (192, 512):
    c = Image.new('RGBA', (tam, tam), (7, 9, 11, 255)); l = logo.copy(); l.thumbnail((int(tam * .82), int(tam * .82)))
    c.paste(l, ((tam - l.width) // 2, (tam - l.height) // 2), l); c.save('%s/icono-%d.png' % (OUT, tam), optimize=True)
shutil.copy(M + 'img/fav180.png', OUT + '/apple-touch-icon.png')
for nom, titulo, corto, inicio in [('tarjeta', 'Monzú Club · Mi tarjeta', 'Monzú Club', '/tarjeta.html'), ('panel', 'Monzú Admin · Panel', 'Monzú Admin', '/panel.html')]:
    json.dump({'name': titulo, 'short_name': corto, 'start_url': inicio, 'scope': '/', 'display': 'standalone', 'background_color': '#07090B', 'theme_color': '#07090B', 'lang': 'es-CR',
               'icons': [{'src': '/icono-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': '/icono-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]},
              open('%s/%s.webmanifest' % (OUT, nom), 'w', encoding='utf-8'), ensure_ascii=False)

# ---------------- librerías ----------------
LIB = A + 'lib/'
for f in ('qrcode.min.js', 'jsqr.min.js'): shutil.copy(LIB + f, OUT + '/js/' + f)

# ---------------- 1) página principal ----------------
t = open(M + 'monzu.tpl.html', encoding='utf-8').read().replace(' style-x=""', '')
js = open(M + 'monzu.js', encoding='utf-8').read()
# reservas reales en lugar del envío directo por WhatsApp
i = js.index("  var abierto=Date.now(), ultimo=0;"); j = js.index("  /* ===== proceso: la línea avanza al bajar ===== */")
js = js[:i] + open(A + 'reservas.js', encoding='utf-8').read() + '\n' + js[j:]
t = t.replace('__JS__', js)
t = rep(t, 'Demo de ejemplo hecha por Solanotech para Monzú Detallados · precios tomados de sus publicaciones', 'Versión de prueba hecha por Solanotech para Monzú Detallados')
t = rep(t, '<li><a href="#agendar">Agendar</a></li>', '<li><a href="#club">Monzú Club</a></li><li><a href="#agendar">Agendar</a></li><li><a href="tarjeta.html">Mi tarjeta</a></li>')
# hora: botones con las horas libres
t = re.sub(r'          <div class="campo"><label for="fHora">Hora</label><select id="fHora">.*?</select></div>\n',
           '          <div class="campo full"><span class="lbl" id="lblHoras">Hora disponible</span><div class="horas" id="horas" role="group" aria-labelledby="lblHoras"></div></div>\n', t, count=1, flags=re.S)
assert 'id="horas"' in t
t = rep(t, '<div class="campo"><label for="fFecha">Fecha deseada</label><input id="fFecha" type="date"></div>', '<div class="campo full"><label for="fFecha">Fecha</label><input id="fFecha" type="date"></div>')
t = re.sub(r'<button class="btn btn-a" type="button" id="enviar">.*?</button>',
           '<button class="btn btn-a" type="button" id="enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>Reservar mi cita</button>', t, count=1, flags=re.S)
t = rep(t, '      <p class="estado" id="estado" role="status"></p>\n',
        '''      <p class="estado" id="estado" role="status"></p>
      <div class="listo" id="listo" hidden>
        <b>✓ ¡Cita reservada!</b><p id="listoTxt"></p><p class="listo-club" id="listoNueva"></p>
        <a class="btn btn-a" id="listoTarjeta" href="tarjeta.html">💧 Ver mi tarjeta Monzú Club</a>
        <button type="button" class="btn btn-b" id="listoWA">Avisar también por WhatsApp</button>
      </div>
''')
t = rep(t, 'Le calculamos el precio al momento y le llega el mensaje listo por WhatsApp.', 'Le calculamos el precio al momento, elige la hora libre y su cita queda reservada. Además le creamos su tarjeta Monzú Club.')
CLUB = '''<section id="club"><div class="wrap club">
  <div class="rv"><span class="eti">Monzú Club</span><h2 class="t">Cada lavado <span class="tq">suma</span></h2>
    <p class="club-p">Con su primera cita le creamos su <b>tarjeta digital</b>. Por cada servicio le damos un sello y con <b>10 sellos su Lavado Premium sale gratis</b>.</p>
    <ul class="club-l"><li>La guarda en su celular como una app, <b>sin descargar nada</b>.</li><li>Ve siempre cuántos sellos lleva y cuántos le faltan.</li><li>No se pierde si cambia de celular: sus sellos quedan guardados.</li></ul>
    <div class="club-acc"><a class="btn btn-a" href="#agendar">Reservar y empezar</a><a class="btn btn-b" href="tarjeta.html">Ver mi tarjeta</a></div></div>
  <div class="club-tj rv" aria-hidden="true">
    <div class="ct-cab"><div><small>Cliente frecuente</small><b>Su nombre</b></div><span>MONZÚ<br>CLUB</span></div>
    <div class="ct-sellos"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i><i></i><i class="regalo">🎁</i></div>
    <div class="ct-pie"><b>6 / 10</b><span>Le faltan 4 para el lavado gratis</span></div>
  </div>
</div></section>

'''
t = rep(t, '<section id="agendar">', CLUB + '<section id="agendar">')
CSS = '''
/* Monzú Club y reservas */
.club{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(30px,5vw,70px);align-items:center}
.club h2{font-size:clamp(2.4rem,6vw,4.4rem);margin-top:12px}
.club-p{color:var(--gr);margin-top:16px;max-width:52ch}.club-p b{color:var(--bl)}
.club-l{margin:18px 0 26px;padding:0;list-style:none;display:grid;gap:10px}
.club-l li{position:relative;padding-left:28px;color:var(--gr)}.club-l li::before{content:"💧";position:absolute;left:0;top:0}.club-l b{color:var(--bl)}
.club-acc{display:flex;gap:12px;flex-wrap:wrap}
.club-tj{border-radius:26px;padding:24px;background:linear-gradient(140deg,#0E5E6B,#0B3B55 45%,#081E2E);box-shadow:0 40px 80px -30px rgba(30,143,216,.8),inset 0 0 0 1px rgba(139,227,238,.3);transform:rotate(-3deg)}
.ct-cab{display:flex;justify-content:space-between}.ct-cab small{display:block;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--tq2);font-weight:700}
.ct-cab b{font-family:var(--t);font-style:italic;font-weight:800;font-size:1.6rem}.ct-cab span{font-family:var(--t);font-weight:900;font-style:italic;color:var(--tq2);text-align:right;line-height:1}
.ct-sellos{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:22px 0 16px}
.ct-sellos i{aspect-ratio:1;border-radius:50%;border:2px dashed rgba(139,227,238,.4);display:grid;place-items:center;font-style:normal}
.ct-sellos i.on{border:2px solid var(--tq2);background:radial-gradient(circle at 35% 30%,#8BE3EE,#1E8FD8)}
.ct-sellos i.regalo{border:2px solid #FFC94D}
.ct-pie{display:flex;justify-content:space-between;align-items:center}.ct-pie b{font-family:var(--t);font-weight:900;font-style:italic;font-size:2rem}.ct-pie span{color:var(--gr);font-size:.85rem}
@media(max-width:860px){.club{grid-template-columns:minmax(0,1fr)}.club-tj{transform:none;max-width:420px}}
.lbl{display:block;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gr);margin-bottom:6px}
.horas{display:flex;flex-wrap:wrap;gap:8px;min-height:48px;align-items:center}
.horas[aria-invalid="true"]{outline:2px solid #F49A9A;outline-offset:4px;border-radius:12px}
.hora{display:grid;justify-items:center;min-width:92px;padding:11px 14px;border-radius:12px;border:1px solid var(--linea2);background:var(--n);color:var(--bl);font:700 .95rem var(--s);cursor:pointer;transition:.2s}
.hora small{font-size:.66rem;font-weight:600;color:var(--gr2)}
.hora:hover:not(:disabled){border-color:var(--tq)}
.hora[aria-pressed="true"]{background:linear-gradient(135deg,var(--tq),var(--az));color:#04141C;border-color:transparent}
.hora:disabled{opacity:.45;cursor:not-allowed;text-decoration:line-through}
.horas-aviso{font-size:.88rem;color:var(--gr)}
.listo{margin-top:14px;padding:18px;border-radius:18px;background:rgba(61,220,132,.1);border:1px solid rgba(61,220,132,.5);display:grid;gap:10px}
.listo b{font-family:var(--t);font-style:italic;font-weight:800;font-size:1.5rem;color:#8EE0B1}
.listo p{color:var(--bl);font-size:.92rem;white-space:pre-line}.listo .listo-club{color:var(--tq2)}
#enviar:disabled{opacity:.6;cursor:wait}
'''
t = rep(t, '</style>', CSS + '</style>', n=1) if t.count('</style>') == 1 else t.replace('</style>', CSS + '</style>', 1)
# textos legales al día
t = rep(t, '<li>La solicitud que se envía por WhatsApp no es una cita confirmada: la cita queda lista cuando Monzú Detallados la confirma.</li>',
        '<li>Al reservar en el sitio, la hora queda apartada y la cita se confirma por WhatsApp con Monzú Detallados.</li>')
t = rep(t, '<h3>5. Ley aplicable</h3>', '<h3>5. Monzú Club</h3><ul><li>Se da un sello por cada servicio terminado. Con 10 sellos, el siguiente Lavado Premium es gratis.</li><li>Los sellos los pone solo Monzú Detallados, son personales y no se cambian por dinero.</li><li>Las condiciones del club pueden cambiar avisando con anticipación; los sellos ya ganados se respetan.</li></ul>\n    <h3>6. Ley aplicable</h3>')
t = rep(t, '<h3>1. Qué datos se piden</h3><p>Nombre, teléfono, fecha y hora deseadas, dirección o zona, el vehículo y su comentario.</p>',
        '<h3>1. Qué datos se piden</h3><p>Nombre, teléfono, fecha y hora de la cita, dirección o zona, el vehículo, los servicios y su comentario. Para Monzú Club se guardan además sus sellos y su historial de lavados.</p>')
t = rep(t, '<li>El formulario no guarda nada en ningún servidor: el mensaje se arma en su navegador y usted decide si lo envía.</li><li>Al enviarlo pasa por WhatsApp (Meta), con su propia política de privacidad.</li>',
        '<li>Su reserva y su tarjeta se guardan en el servidor del sitio (Netlify), con conexión cifrada. Solo Monzú Detallados puede verlas, desde un panel con contraseña.</li><li>Su tarjeta tiene un enlace único y secreto: no comparta ese enlace.</li><li>Las citas se borran a los 4 meses; la tarjeta se mantiene mientras usted la use, o la borramos cuando lo pida.</li><li>Si usa WhatsApp para escribirnos, aplica la política de privacidad de Meta.</li>')
t = t.replace('{{FECHA}}', FECHA)
imgs = {'logo': uri('logo.webp', 'image/webp'), 'fav64': uri('fav64.png', 'image/png'), 'fav180': uri('fav180.png', 'image/png')}
for k in ['deluxe', 'motor', 'tapiceria', 'scents1', 'scents2', 'scents3']: imgs[k] = uri(k + '.webp', 'image/webp')
t = re.sub(r'\{\{IMG:(\w+)\}\}', lambda m: imgs[m.group(1)], t)
def qr_svg(u):
    b = io.BytesIO(); segno.make(u, error='m').save(b, kind='svg', scale=4, border=1, dark='#07090B', xmldecl=False, svgns=True, omitsize=True); return b.getvalue().decode()
t = t.replace('{{QR_RESENA}}', qr_svg('https://www.google.com/maps/search/Monzu+Detallados+Cartago')).replace('{{QR_WEB}}', qr_svg('https://ssolanotech.com'))
t = t.replace('{{WA}}', 'https://wa.me/50672686906?text=Hola%20Monz%C3%BA%20Detallados%2C%20quiero%20informaci%C3%B3n%20para%20un%20detallado')
assert not re.search(r'\{\{|__JS__', t) and ' style="' not in t
csp_index = csp_de(t)
open(OUT + '/index.html', 'w', encoding='utf-8').write(con_csp(t, csp_index))

# ---------------- 2) tarjeta y 3) panel ----------------
comun = {'{{LOGO}}': imgs['logo'], '{{FAV}}': imgs['fav180'], '{{FECHA}}': FECHA}
csps = {}
for pag in ('tarjeta', 'panel'):
    p = open(A + pag + '.tpl.html', encoding='utf-8').read()
    p = p.replace('__JS__', open(A + pag + '.js', encoding='utf-8').read())
    for k, v in comun.items(): p = p.replace(k, v)
    assert not re.search(r'\{\{|__JS__', p) and ' style="' not in p, pag
    csps[pag] = csp_de(p, extra_script=" 'self'", img="'self' data: blob:" if pag == 'panel' else "'self' data:")
    open('%s/%s.html' % (OUT, pag), 'w', encoding='utf-8').write(con_csp(p, csps[pag]))

# ---------------- demostración con dos celulares (para enseñar por WhatsApp) ----------------
demo = open(A + '../../../monzu-club-demo/index.html', encoding='utf-8').read()
demo = demo.replace('Demostración hecha por Solanotech para Monzú Detallados', 'Demostración de Monzú Club · <a href="/">ver la página de Monzú</a>', 1)
demo = demo.replace('.demobar{', '.demobar a{color:inherit;text-decoration:underline}\n.demobar{', 1)
open(OUT + '/demo.html', 'w', encoding='utf-8').write(demo)

# ---------------- cabeceras y robots ----------------
base = "  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n  Cross-Origin-Opener-Policy: same-origin\n"
sin_cam = "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n"
hd = ''
for ruta, csp, extra in [('/', csp_index, sin_cam), ('/index.html', csp_index, sin_cam),
                         ('/tarjeta.html', csps['tarjeta'], sin_cam + "  X-Robots-Tag: noindex\n"), ('/tarjeta', csps['tarjeta'], sin_cam + "  X-Robots-Tag: noindex\n"),
                         ('/panel.html', csps['panel'], "  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n"),
                         ('/panel', csps['panel'], "  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n")]:
    hd += ruta + "\n  Content-Security-Policy: " + csp + "\n" + base + extra
hd += "/js/*\n  Cache-Control: public, max-age=604800\n"
open(OUT + '/_headers', 'w').write(hd)
open(OUT + '/robots.txt', 'w').write('User-agent: *\nDisallow: /demo.html\nDisallow: /panel.html\nDisallow: /panel\nDisallow: /tarjeta.html\nDisallow: /api/\n')
print('listo ->', OUT, {f: os.path.getsize(OUT + '/' + f) for f in os.listdir(OUT) if f.endswith('.html')})
