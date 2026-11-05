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
# Dominio público: cámbielo aquí cuando se conecte el dominio propio (o use MONZU_DOMINIO=https://... al construir)
DOM = os.environ.get('MONZU_DOMINIO', 'https://monzu-detallados.netlify.app').rstrip('/')
os.makedirs(OUT + '/js', exist_ok=True)

def uri(f, m): return 'data:%s;base64,%s' % (m, base64.b64encode(open(M + 'img/' + f, 'rb').read()).decode())
h = lambda x: "'sha256-" + base64.b64encode(hashlib.sha256(x.encode()).digest()).decode() + "'"

def rep(t, a, b, n=1):
    c = t.count(a); assert c == n, (c, a[:90]); return t.replace(a, b)

def csp_de(t, extra_script="", connect="'self'", img="'self' data:"):
    est = re.findall(r'<style>(.*?)</style>', t, re.S); scr = re.findall(r'<script>(.*?)</script>', t, re.S)
    assert len(scr) == 1, len(scr)
    return "; ".join(["default-src 'none'", "script-src " + h(scr[0]) + extra_script, "style-src " + " ".join(h(e) for e in est),
                      "font-src 'self'", "img-src " + img, "connect-src " + connect, "manifest-src 'self'", "form-action 'none'", "base-uri 'none'",
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

# ---------------- fuentes locales (sin Google) ----------------
os.makedirs(OUT + '/fonts', exist_ok=True)
for f in os.listdir(A + 'fonts'):
    if f.endswith('.woff2'): shutil.copy(A + 'fonts/' + f, OUT + '/fonts/' + f)
FUENTES = open(A + 'fonts/fuentes.css', encoding='utf-8').read()
def sin_google(t):
    t = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>\n', '', t)
    t, n = re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">\n', '', t)
    assert n == 1, 'falta el enlace a Google Fonts'
    return t.replace('<style>\n', '<style>\n' + FUENTES, 1)

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
t = rep(t, '<div class="demobar">Demo de ejemplo hecha por Solanotech para Monzú Detallados · precios tomados de sus publicaciones</div>\n', '')
t = sin_google(t)
SEO = '\n'.join(['<link rel="canonical" href="%s/">' % DOM, '<meta property="og:url" content="%s/">' % DOM, '<meta property="og:image" content="%s/og.jpg">' % DOM,
                 '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">', '<meta name="twitter:card" content="summary_large_image">',
                 '<meta name="robots" content="index,follow">', '<link rel="manifest" href="/tarjeta.webmanifest">'])
t = rep(t, '<meta property="og:type" content="website">', SEO + '\n<meta property="og:type" content="website">')
t = rep(t, '<li><a href="#agendar">Agendar</a></li>', '<li><a href="#club">Monzú Club</a></li><li><a href="#agendar">Agendar</a></li><li><a href="tarjeta.html">Mi tarjeta</a></li>')
# hora: botones con las horas libres
t = re.sub(r'          <div class="campo"><label for="fHora">Hora</label><select id="fHora">.*?</select></div>\n',
           '          <div class="campo full"><span class="lbl" id="lblHoras">Hora disponible</span><div class="horas" id="horas" role="group" aria-labelledby="lblHoras"></div></div>\n', t, count=1, flags=re.S)
assert 'id="horas"' in t
t = rep(t, '<div class="campo"><label for="fTel">Teléfono / WhatsApp</label><input id="fTel" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="8888-0000"></div>',
        '<div class="campo"><label for="fTel">Teléfono / WhatsApp</label><input id="fTel" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="8888-0000"></div>\n          <div class="campo full"><label for="fPin">PIN de Monzú Club (4 números)</label><input id="fPin" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="••••" aria-describedby="fPinAyuda"><small class="ayuda-pin" id="fPinAyuda">¿Es nuevo? Invente un PIN y con su teléfono entra a su tarjeta de sellos. ¿Ya es miembro? Use el suyo.</small></div>')
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
    <ul class="club-l"><li>La guarda en su celular como una app, <b>sin descargar nada</b>.</li><li>Ve siempre cuántos sellos lleva y cuántos le faltan.</li><li>No se pierde si cambia de celular: entra con su teléfono y su PIN.</li></ul>
    <div class="club-acc"><a class="btn btn-a" href="tarjeta.html#registro">Unirme gratis</a><a class="btn btn-b" href="tarjeta.html">Ya soy miembro</a></div>\n    <p class="club-p club-nota">Su usuario es su <b>teléfono</b> y su clave un <b>PIN de 4 números</b>. Entre desde cualquier celular.</p></div>
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
.club-acc{display:flex;gap:12px;flex-wrap:wrap}.club-nota{font-size:.88rem;margin-top:14px}
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
.ayuda-pin{display:block;margin-top:6px;font-size:.78rem;color:var(--gr)}
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
        '<h3>1. Qué datos se piden</h3><p>Nombre, teléfono, fecha y hora de la cita, dirección o zona, el vehículo, los servicios y su comentario. Para Monzú Club se guardan además sus sellos, su historial de lavados y su PIN, que se guarda cifrado: nadie puede leerlo, ni Monzú.</p>')
t = rep(t, '<li>El formulario no guarda nada en ningún servidor: el mensaje se arma en su navegador y usted decide si lo envía.</li><li>Al enviarlo pasa por WhatsApp (Meta), con su propia política de privacidad.</li>',
        '<li>Su reserva y su tarjeta se guardan en el servidor del sitio, contratado con Netlify, Inc. (Estados Unidos), con conexión cifrada. Al aceptar, usted autoriza esa transferencia para prestar el servicio.</li><li>Solo Monzú Detallados puede ver los datos, desde un panel con contraseña. Nadie más los recibe, ni se venden.</li><li>Su tarjeta tiene un enlace único y secreto: no comparta ese enlace ni su PIN.</li><li>Las citas se borran solas a los 4 meses. La tarjeta se mantiene mientras usted la use, y puede borrarla cuando quiera con el botón “Borrar mi tarjeta y mis datos”.</li><li>Si usa WhatsApp para escribirnos, aplica la política de privacidad de Meta.</li>')
t = rep(t, '<li>Las tipografías se cargan desde Google Fonts, que recibe datos técnicos como su dirección IP.</li>', '<li>Las tipografías y todo el contenido se sirven desde el mismo sitio: no hay rastreadores, publicidad ni análisis de terceros.</li>')
t = rep(t, '<h3>5. Sus derechos</h3>', '<h3>5. Responsable</h3><p>El responsable de la base de datos es Monzú Detallados (Isaac Monge), Cartago. Solanotech actúa solo como encargado técnico (desarrollo y mantenimiento del sitio) y no usa los datos para nada más.</p>\n    <h3>6. Sus derechos</h3>')
t = rep(t, '<h3>Servicios de terceros</h3><p>Google Fonts entrega las tipografías. WhatsApp y Facebook solo se abren si usted toca un enlace.</p>',
        '<h3>Almacenamiento en su navegador</h3><p>Para que no tenga que escribir su PIN cada vez, su navegador guarda el enlace de su tarjeta Monzú Club. Es una función necesaria y no sirve para rastrearle; se borra con “Salir de esta tarjeta”.</p><h3>Servicios de terceros</h3><p>Ninguno al navegar. WhatsApp y Facebook solo se abren si usted toca un enlace.</p>')
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
    p = sin_google(p.replace('__JS__', open(A + pag + '.js', encoding='utf-8').read()))
    for k, v in comun.items(): p = p.replace(k, v)
    assert not re.search(r'\{\{|__JS__', p) and ' style="' not in p, pag
    csps[pag] = csp_de(p, extra_script=" 'self'", img="'self' data: blob:" if pag == 'panel' else "'self' data:")
    open('%s/%s.html' % (OUT, pag), 'w', encoding='utf-8').write(con_csp(p, csps[pag]))

# ---------------- producción: sin página de demostración ----------------
if os.path.exists(OUT + '/demo.html'): os.remove(OUT + '/demo.html')

# ---------------- imagen para compartir (WhatsApp / Facebook) y sitemap ----------------
og = Image.open(M + 'img/portada.png').convert('RGB'); w, hh = og.size; esc = max(1200 / w, 630 / hh)
og = og.resize((int(w * esc), int(hh * esc))); x0 = (og.width - 1200) // 2; y0 = (og.height - 630) // 2; og = og.crop((x0, y0, x0 + 1200, y0 + 630))
velo = Image.new('RGBA', (1200, 630), (7, 9, 11, 0)); from PIL import ImageDraw
dv = ImageDraw.Draw(velo)
for xx in range(1200): dv.line([(xx, 0), (xx, 630)], fill=(7, 9, 11, int(235 * max(0, 1 - xx / 760))))
og = Image.alpha_composite(og.convert('RGBA'), velo); l = logo.copy(); l.thumbnail((520, 300)); og.paste(l, (70, (630 - l.height) // 2), l)
og.convert('RGB').save(OUT + '/og.jpg', quality=86)
open(OUT + '/sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>%s/</loc></url></urlset>\n' % DOM)

# ---------------- cabeceras y robots ----------------
base = "  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Resource-Policy: same-origin\n  X-Permitted-Cross-Domain-Policies: none\n"
sin_cam = "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n"
hd = ''
for ruta, csp, extra in [('/', csp_index, sin_cam), ('/index.html', csp_index, sin_cam),
                         ('/tarjeta.html', csps['tarjeta'], sin_cam + "  X-Robots-Tag: noindex\n"), ('/tarjeta', csps['tarjeta'], sin_cam + "  X-Robots-Tag: noindex\n"),
                         ('/panel.html', csps['panel'], "  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n"),
                         ('/panel', csps['panel'], "  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n")]:
    hd += ruta + "\n  Content-Security-Policy: " + csp + "\n" + base + extra
hd += "/js/*\n  Cache-Control: public, max-age=604800\n  X-Content-Type-Options: nosniff\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n"
open(OUT + '/_headers', 'w').write(hd)
open(OUT + '/robots.txt', 'w').write('User-agent: *\nAllow: /\nDisallow: /panel.html\nDisallow: /panel\nDisallow: /tarjeta.html\nDisallow: /api/\nSitemap: %s/sitemap.xml\n' % DOM)
print('listo ->', OUT, {f: os.path.getsize(OUT + '/' + f) for f in os.listdir(OUT) if f.endswith('.html')})
