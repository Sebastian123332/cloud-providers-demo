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
DOM = os.environ.get('MONZU_DOMINIO', 'https://demomonzu.sebas43br.workers.dev').rstrip('/')
os.makedirs(OUT + '/js', exist_ok=True)

def uri(f, m): return 'data:%s;base64,%s' % (m, base64.b64encode(open(M + 'img/' + f, 'rb').read()).decode())
h = lambda x: "'sha256-" + base64.b64encode(hashlib.sha256(x.encode()).digest()).decode() + "'"

def rep(t, a, b, n=1):
    c = t.count(a); assert c == n, (c, a[:90]); return t.replace(a, b)

def csp_de(t, extra_script="", connect="'self'", img="'self' data:", tt=True, tt_pol="'none'", worker=False):
    est = re.findall(r'<style>(.*?)</style>', t, re.S); scr = re.findall(r'<script>(.*?)</script>', t, re.S)
    assert len(scr) == 1, len(scr)
    return "; ".join(["default-src 'none'", "script-src " + h(scr[0]) + extra_script, "style-src " + " ".join(h(e) for e in est),
                      "font-src 'self'", "img-src " + img, "connect-src " + connect, "manifest-src 'self'"] + (["worker-src 'self'"] if worker else []) + [ "form-action 'none'", "base-uri 'none'",
                      "object-src 'none'"] + (["require-trusted-types-for 'script'", "trusted-types " + tt_pol] if tt else []) + ["frame-ancestors 'none'", "upgrade-insecure-requests"])

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
for f in ('qrcode.min.js', 'jsqr.min.js', 'mapa.js'): shutil.copy(LIB + f, OUT + '/js/' + f)
# el mapa cambia seguido: nombre con huella para que el celular nunca use una copia vieja guardada
MAPA = 'mapa.' + hashlib.sha256(open(LIB + 'mapa.js', 'rb').read()).hexdigest()[:10] + '.js'
for viejo in os.listdir(OUT + '/js'):
    if re.fullmatch(r'mapa\.[0-9a-f]{10}\.js', viejo) and viejo != MAPA: os.remove(OUT + '/js/' + viejo)
shutil.copy(LIB + 'mapa.js', OUT + '/js/' + MAPA)

# ---------------- 1) página principal ----------------
t = open(M + 'monzu.tpl.html', encoding='utf-8').read().replace(' style-x=""', '')
js = open(M + 'monzu.js', encoding='utf-8').read()
# reservas reales en lugar del envío directo por WhatsApp
i = js.index("  var abierto=Date.now(), ultimo=0;"); j = js.index("  /* ===== proceso: la línea avanza al bajar ===== */")
js = js[:i] + open(A + 'reservas.js', encoding='utf-8').read() + '\n' + js[j:]
# "Arme su paquete": el precio del formulario suma las opciones escogidas
js = rep(js, "  var EXTRAS=[", "  var ARMAR={n:'Arme su detallado',items:{}}; function ARMAR_SEL(){ return [].map.call(d.querySelectorAll('#armarItems input:checked'),function(i){ return i.value }) }\n  var EXTRAS=[")
js = rep(js, "    if(p!=='ninguno'){ var pr=PAQ[p][v]; lineas.push([PAQ[p].n+(v==='sedan'?' · sedán':' · SUV/pick up'),pr]); total+=pr }",
         "    var conP=false; if(p==='armar'){ ARMAR_SEL().forEach(function(k){ var it=ARMAR.items[k]; if(!it) return; lineas.push([ARMAR.n+': '+it.n,it[v]]); total+=it[v]; conP=true }) } else if(p!=='ninguno'&&PAQ[p]){ var pr=PAQ[p][v]; lineas.push([PAQ[p].n+(v==='sedan'?' · sedán':' · SUV/pick up'),pr]); total+=pr; conP=true }")
js = rep(js, "var pr=(x.conPaq&&p!=='ninguno')?x.conPaq:x.p;", "var pr=(x.conPaq&&conP)?x.conPaq:x.p;")
js = rep(js, "    d.querySelectorAll('[data-precio]').forEach(function(b){ b.textContent=col(PAQ[b.dataset.precio][veh]) });", "    d.querySelectorAll('[data-precio]').forEach(function(b){ if(PAQ[b.dataset.precio]) b.textContent=col(PAQ[b.dataset.precio][veh]) }); if(typeof pintaDinamicos==='function') pintaDinamicos();")
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
# ---------------- "¿Qué incluye?" de cada paquete ----------------
INC = {
 'premium': ('Premium', '₡16.000', '₡18.000', None, [
   ('🧽', 'Interior', 'Aspirado profundo y limpieza de plásticos internos, con restaurador e hidratante para plásticos y cuero.'),
   ('🚿', 'Lavado exterior', 'Pre-lavado para quitar la suciedad sin rayar, y lavado con shampoo pH neutro que cuida los cerámicos.'),
   ('🛞', 'Llantas, aros y guardabarros', 'Limpieza y detallado, con hidrofobia (repelencia).'),
   ('🪟', 'Vidrios', 'Detallado de vidrios con repelencia.'),
   ('✨', 'Protección y brillo', 'Cera cerámica.')]),
 'deluxe': ('Deluxe', '₡32.000', '₡35.000', 'Todo lo del Detallado Premium, más:', [
   ('🧼', 'Interior a fondo', 'Limpieza minuciosa del interior.'),
   ('💺', 'Asientos y puertas', 'Eliminación de manchas superficiales en asientos y puertas.'),
   ('🎨', 'Pintura', 'Descontaminación de pintura.'),
   ('🛡️', 'Sellado cerámico de 10 meses', 'Protección duradera para la pintura.'),
   ('⚫', 'Partes negras', 'Restaurador de partes negras externas.'),
   ('🌸', 'Aroma', 'Aromatizante, si lo desea.')]),
}
dlgs = ''
EXTRA_K = {'Limpieza de motor': 'motor', 'Limpieza de asientos': 'asientos', 'Limpieza de techo': 'techo', 'Tapicería completa': 'tapiceria', 'Limpieza de colchones': 'colchon'}
for nomx, kx in EXTRA_K.items():
    t, nn = re.subn(r'(<h3>%s</h3><p>[^<]*</p>)<b>' % re.escape(nomx), r'\1<b data-x="%s">' % kx, t); assert nn == 1, nomx
# listas de "incluye" en las tarjetas de paquetes: si el dueño las cambia, se reemplazan
BASE_INC = {'premium': ['Aspirado profundo y limpieza de plásticos internos, con restaurador e hidratante para plásticos y cuero', 'Pre-lavado para quitar la suciedad sin rayar, y lavado con shampoo pH neutro que cuida los cerámicos', 'Limpieza y detallado de llantas, aros y guardabarros, con hidrofobia (repelencia)', 'Detallado de vidrios con repelencia', 'Cera cerámica'],
            'deluxe': ['Todo el Detallado Premium, más:', 'Limpieza minuciosa del interior', 'Eliminación de manchas superficiales en asientos y puertas', 'Descontaminación de pintura', 'Sellado cerámico de 10 meses', 'Restaurador de partes negras externas', 'Aromatizante, si lo desea']}
for kx in BASE_INC:
    t, nn = re.subn(r'(<article class="paq[^"]*" data-paq="%s">.*?)<ul>' % kx, lambda m: m.group(1) + '<ul data-inc-lista="%s" data-inc-base="%s" data-inc-base2="%s">' % (kx, kx, '|'.join(BASE_INC[kx]).replace('"', '&quot;')), t, count=1, flags=re.S); assert nn == 1, kx
for k, (nom, ps, pv, intro, pasos) in INC.items():
    t = rep(t, '<a class="btn %s" href="#agendar" data-elige="%s">' % ('btn-b' if k == 'premium' else 'btn-a', k),
            '<button type="button" class="incluye" data-legal="inc-%s">¿Qué incluye el %s? <span aria-hidden="true">→</span></button>\n      <a class="btn %s" href="#agendar" data-elige="%s">' % (k, nom, 'btn-b' if k == 'premium' else 'btn-a', k))
    li = ''.join('<li><span class="inc-ico" aria-hidden="true">%s</span><div><b>%s</b><p>%s</p></div></li>' % p for p in pasos)
    dlgs += ('<dialog class="legal inc" id="dlg-inc-%s" aria-labelledby="t-inc-%s">\n  <div class="lg-head"><h2 id="t-inc-%s">Detallado %s</h2><button type="button" data-cerrar aria-label="Cerrar">✕</button></div>\n'
             '  <div class="lg-body"><div class="inc-precios"><div><small>Sedán</small><b data-inc-precio="%s-sedan">%s</b></div><div><small>SUV · Pick up · XL</small><b data-inc-precio="%s-suv">%s</b></div></div>%s\n'
             '    <ol class="inc-lista">%s</ol>\n    <p class="inc-nota">Lo hacemos a domicilio en Cartago. El precio no incluye el domicilio, que depende de la ubicación del vehículo.</p>\n'
             '    <a class="btn btn-a" href="#agendar" data-elige="%s">Reservar el %s</a></div>\n</dialog>\n') % (k, k, k, nom, k, ps, k, pv, ('<p class="inc-intro">%s</p>' % intro) if intro else '', li, k, nom)
t = rep(t, '<dialog class="legal" id="dlg-terminos"', dlgs + '<dialog class="legal" id="dlg-terminos"')
# ubicación con mapa (flecha fija, el cliente mueve el mapa o usa su ubicación)
MAPA_HTML = '''<div class="ubica"><div class="ubica-btns"><button type="button" class="btn-ubi" id="bMiUbi">📍 Usar mi ubicación</button><button type="button" class="btn-ubi" id="bMapa">🗺️ Marcar en el mapa</button></div>
            <div class="mapa" id="mapa" hidden></div><p class="ubica-txt" id="ubiTxt">Opcional: marque dónde está el carro y llegamos directo.</p></div>'''
t = rep(t, '<input id="fLugar" maxlength="120" placeholder="Ej. San Nicolás, 200 m norte de la iglesia"></div>',
        '<input id="fLugar" maxlength="120" placeholder="Ej. San Nicolás, 200 m norte de la iglesia">' + MAPA_HTML + '</div>')
t = rep(t, '\n<script>\n', '\n<script src="/js/%s"></script>\n<script>\n' % MAPA)
# permiso para escribirle por WhatsApp (Meta exige que el cliente lo acepte)
t = rep(t, 'Autorizo a Monzú Detallados a usar mis datos para atender esta cita,', 'Autorizo a Monzú Detallados a usar mis datos para atender esta cita y a enviarme por WhatsApp la confirmación y los recordatorios de mis citas,')
t = rep(t, '<button type="button" data-legal="cookies">Cookies</button></div>', '<button type="button" data-legal="cookies">Cookies</button><a href="/privacidad">Política de privacidad</a><a href="/terminos">Términos</a><a href="/eliminar-datos">Eliminar mis datos</a></div>')
META = os.environ.get('MONZU_META_TAG', '').strip()
if META:
    assert re.fullmatch(r'[a-z0-9]{20,40}', META), 'código de verificación de Meta inválido'
    t = rep(t, '<meta property="og:type" content="website">', '<meta name="facebook-domain-verification" content="%s">\n<meta property="og:type" content="website">' % META)
# método de pago + política de multa
t = rep(t, '          <div class="campo full"><label for="fNota">Comentario (opcional)</label>',
        '''          <div class="campo full"><span class="lbl" id="lblPago">¿Cómo va a pagar?</span><div class="pagos" id="pagos" role="radiogroup" aria-labelledby="lblPago">
            <label class="pago"><input type="radio" name="pago" value="Efectivo"><span>💵 Efectivo</span></label>
            <label class="pago"><input type="radio" name="pago" value="SINPE Móvil"><span>📱 SINPE Móvil</span></label>
            <label class="pago"><input type="radio" name="pago" value="Transferencia"><span>🏦 Transferencia</span></label></div>
            <small class="ayuda-pin">Se paga al terminar el servicio. Los datos para SINPE o transferencia se los damos por WhatsApp.</small></div>
          <div class="campo full"><label for="fNota">Comentario (opcional)</label>''')
t = rep(t, '<p class="peq">No incluye el domicilio, que depende de su ubicación. Precio final confirmado por WhatsApp.</p>',
        '<p class="peq">No incluye el domicilio, que depende de su ubicación. Precio final confirmado por WhatsApp.</p>\n      <p class="peq politica">🔔 Le recordamos su cita 24 horas y 1 hora antes. Si no puede llegar, cancele desde su tarjeta con al menos 2 horas. Si no se presenta sin avisar, se cobra una multa de ₡5.000 en su próximo lavado.</p>')
t = rep(t, '<li>Si necesita cambiar o cancelar la cita, avise con anticipación por WhatsApp.</li>', '<li>Puede cancelar su cita desde su tarjeta Monzú Club hasta 2 horas antes. Con menos tiempo, avise por WhatsApp.</li><li>Si no se presenta a la cita sin avisar, se cobra una multa de ₡5.000 que se suma al total de su próxima cita. Monzú Detallados puede anularla si hubo un motivo justificado.</li><li>Si activa las notificaciones en su tarjeta, le enviamos un recordatorio 24 horas y 1 hora antes de la cita.</li><li>Formas de pago: efectivo, SINPE Móvil o transferencia, al terminar el servicio.</li>')
t = rep(t, '<div class="campo"><label for="fFecha">Fecha deseada</label><input id="fFecha" type="date"></div>', '<div class="campo full"><label for="fFecha">Fecha</label><input id="fFecha" type="date"></div>')
t = re.sub(r'<button class="btn btn-a" type="button" id="enviar">.*?</button>',
           '<button class="btn btn-a" type="button" id="enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>Reservar mi cita</button>', t, count=1, flags=re.S)
t = rep(t, '      <p class="estado" id="estado" role="status"></p>\n',
        '''      <p class="estado" id="estado" role="status"></p>
      <div class="listo" id="listo" hidden>
        <b>✓ ¡Cita reservada!</b><p id="listoTxt"></p><p class="listo-multa" id="listoMulta" hidden></p><p class="listo-club" id="listoNueva"></p>
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
.pagos{display:flex;flex-wrap:wrap;gap:8px}.pagos[aria-invalid="true"]{outline:2px solid #F49A9A;outline-offset:4px;border-radius:12px}
.pago{position:relative;cursor:pointer}.pago input{position:absolute;opacity:0;width:1px;height:1px}
.pago span{text-transform:none;letter-spacing:normal;display:block;padding:11px 14px;border-radius:12px;border:1px solid var(--linea2);background:var(--n);color:var(--bl);font:700 .92rem var(--s);transition:.2s}
.pago input:checked+span{background:linear-gradient(135deg,var(--tq),var(--az));color:#04141C;border-color:transparent}
.pago input:focus-visible+span{outline:2px solid var(--tq2);outline-offset:2px}
.politica{margin-top:8px;padding:10px 12px;border-radius:12px;background:rgba(255,201,77,.08);border:1px solid rgba(255,201,77,.35)}
.listo .listo-multa{color:#FFC94D;font-weight:700}
.incluye{align-self:flex-start;background:none;border:0;padding:4px 0;font:700 .95rem var(--s);color:var(--tq2);text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(139,227,238,.5);cursor:pointer}
.incluye:hover{color:var(--bl)}
.legales a{color:var(--gr);text-decoration:underline;text-underline-offset:3px}.legales a:hover{color:var(--tq)}
.inc .lg-body{display:grid;gap:16px}
.inc-precios{display:grid;grid-template-columns:1fr 1fr;gap:10px}.inc-precios div{background:var(--n);border:1px solid var(--linea2);border-radius:14px;padding:12px}
.inc-precios small{display:block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gr)}.inc-precios b{font-family:var(--t);font-style:italic;font-weight:900;font-size:1.6rem}
.inc-intro{font-weight:700;color:var(--tq2)}
.inc-lista{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.inc-lista li{display:grid;grid-template-columns:42px minmax(0,1fr);gap:12px;align-items:start;background:var(--n);border:1px solid var(--linea);border-radius:14px;padding:12px}
.inc-ico{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:1.3rem;background:rgba(76,195,212,.12)}
.inc-lista b{display:block}.inc-lista p{color:var(--gr);font-size:.9rem;margin:2px 0 0}
.inc-nota{font-size:.82rem;color:var(--gr)}
.ubica{display:grid;gap:8px;margin-top:8px}.ubica-btns{display:flex;flex-wrap:wrap;gap:8px}
.btn-ubi{padding:9px 12px;border-radius:10px;border:1px solid var(--linea2);background:var(--n);color:var(--bl);font:700 .85rem var(--s);cursor:pointer}
.btn-ubi:hover{border-color:var(--tq)}.ubica-txt{font-size:.8rem;color:var(--gr)}.ubica-txt.ok{color:#8EE0B1}
.ubica-txt a{color:var(--tq2)}
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
        '<li>Su reserva y su tarjeta se guardan en el servidor del sitio, contratado con Cloudflare, Inc. (Estados Unidos), con conexión cifrada. Al aceptar, usted autoriza esa transferencia para prestar el servicio.</li><li>Solo Monzú Detallados puede ver los datos, desde un panel con contraseña. Nadie más los recibe, ni se venden.</li><li>Su tarjeta tiene un enlace único y secreto: no comparta ese enlace ni su PIN.</li><li>Las citas se borran solas a los 4 meses. La tarjeta se mantiene mientras usted la use, y puede borrarla cuando quiera con el botón “Borrar mi tarjeta y mis datos”.</li><li>Si usa WhatsApp para escribirnos, aplica la política de privacidad de Meta.</li>')
t = rep(t, '<li>Las tipografías se cargan desde Google Fonts, que recibe datos técnicos como su dirección IP.</li>', '<li>Las tipografías y todo el contenido se sirven desde el mismo sitio: no hay rastreadores, publicidad ni análisis de terceros.</li><li>Si usted marca su ubicación, el mapa y la dirección aproximada se obtienen de OpenStreetMap y solo se guarda el punto que usted elige, para llegar a su cita. Su ubicación se pide solo si toca “Usar mi ubicación”.</li>')
t = rep(t, '<h3>5. Sus derechos</h3>', '<h3>5. Responsable</h3><p>El responsable de la base de datos es Monzú Detallados (Isaac Monge), Cartago. Solanotech actúa solo como encargado técnico (desarrollo y mantenimiento del sitio) y no usa los datos para nada más.</p>\n    <h3>6. Sus derechos</h3>')
t = rep(t, '<h3>Servicios de terceros</h3><p>Google Fonts entrega las tipografías. WhatsApp y Facebook solo se abren si usted toca un enlace.</p>',
        '<h3>Almacenamiento en su navegador</h3><p>Para que no tenga que escribir su PIN cada vez, su navegador guarda el enlace de su tarjeta Monzú Club. Es una función necesaria y no sirve para rastrearle; se borra con “Salir de esta tarjeta”.</p><h3>Servicios de terceros</h3><p>Ninguno al navegar. WhatsApp y Facebook solo se abren si usted toca un enlace.</p>')
t = rep(t, '<li>Si usa WhatsApp para escribirnos, aplica la política de privacidad de Meta.</li>', '<li>Con su permiso, le enviamos por WhatsApp la confirmación y los recordatorios de su cita, desde el número oficial de Monzú y con la plataforma oficial de WhatsApp Business (Meta). No le enviamos publicidad. Para no recibirlos, responda “NO” o escríbanos.</li><li>Si usa WhatsApp para escribirnos, aplica la política de privacidad de Meta.</li>')

# ---------------- "Arme su paquete" y paquetes nuevos del dueño (se llenan en vivo desde /api/catalogo) ----------------
t = rep(t, '<label class="op"><input type="radio" name="paq" value="ninguno">', '<label class="op" id="opArmarL" hidden><input type="radio" name="paq" value="armar"><span><b id="opArmarN">Arme su paquete</b><small>A su gusto</small></span></label>\n          <label class="op" id="opNinguno"><input type="radio" name="paq" value="ninguno">')
t = rep(t, '''      <fieldset class="bloque"><legend>3 · Adicionales</legend>''', '''      <div class="armar-f" id="armarF" hidden><span class="lbl">Escoja lo que quiere en su paquete</span><div class="opciones" id="armarItems"></div></div>
      <fieldset class="bloque"><legend>3 · Adicionales</legend>''')
t = rep(t, '  <p class="nota">Los precios no incluyen el domicilio: el costo depende de la ubicación de su vehículo.</p>', '''  <div class="armar-card rv" id="armarCard" hidden>
    <div class="ac-cab"><div><span class="eti">Paquete personalizado</span><h3 class="t" id="armarTit">Arme su detallado</h3><p id="armarDesc">Escoja solo lo que su carro necesita.</p></div>
      <div class="ac-tot"><small>Su paquete</small><b id="armarTotal">₡0</b><span data-tipo>sedán</span></div></div>
    <div class="ac-lista" id="armarLista"></div>
    <button type="button" class="btn btn-a" id="armarReservar">Reservar mi paquete</button>
  </div>
  <p class="nota">Los precios no incluyen el domicilio: el costo depende de la ubicación de su vehículo.</p>''')
ARMAR_CSS = """
.armar-card{margin-top:18px;border-radius:26px;padding:clamp(22px,3vw,34px);background:linear-gradient(160deg,rgba(76,195,212,.12),var(--n2) 55%);border:1px solid rgba(76,195,212,.4);display:grid;gap:18px}
.ac-cab{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap}
.ac-cab h3{font-size:clamp(2rem,4vw,2.8rem);margin-top:6px}.ac-cab p{color:var(--gr);margin-top:6px}
.ac-tot{text-align:right}.ac-tot small{display:block;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gr);font-weight:700}.ac-tot b{font-family:var(--t);font-style:italic;font-weight:900;font-size:2.4rem;line-height:1}.ac-tot span{display:block;font-size:.8rem;color:var(--gr)}
.ac-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.ac-op{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;border:1px solid var(--linea2);background:var(--n);cursor:pointer;transition:.2s}
.ac-op input{accent-color:var(--tq);width:20px;height:20px;flex:none}
.ac-op span{display:grid;font-weight:600;font-size:.92rem}.ac-op small{color:var(--tq2);font-weight:700}
.ac-op:has(input:checked){border-color:var(--tq);background:rgba(76,195,212,.08)}
.armar-f{display:grid;gap:8px;margin:-6px 0 14px}
.op span b{font-weight:600}
@media(max-width:600px){.ac-tot{text-align:left}.ac-cab{flex-direction:column}}
"""
t = t.replace('</style>', ARMAR_CSS + '</style>', 1)
# ---------------- trabajos reales: fotos y videos ----------------
TRAB = [  # (archivo, título, subtítulo, alt)
 ('tacoma-negra', 'Brillo espejo', 'Detallado exterior', 'Pick up negra recién detallada, con la pintura brillante como espejo'),
 ('carro-negro-antes-ahora', 'Antes y ahora', 'Lavado y encerado', 'Carro negro antes y después del detallado de Monzú'),
 ('vid:pulido', 'Pulido de parabrisas', 'Video', 'Video del pulido del parabrisas con máquina'),
 ('durango-mate', 'Pintura mate', 'Cuidado especial', 'Camioneta con pintura negro mate después del lavado'),
 ('asiento-antes-ahora', 'Tapicería', 'Antes y ahora', 'Asiento de tela con manchas antes y limpio después'),
 ('motor-fiat', 'Motor', 'Cero grasa', 'Motor limpio y con los plásticos restaurados'),
 ('everest-blanca', 'Blanco impecable', 'Detallado completo', 'Camioneta blanca recién lavada y detallada'),
 ('interior-durango', 'Interior', 'Cuero y plásticos', 'Interior con asientos de cuero y plásticos limpios'),
 ('l200-gris', 'Acabado brillante', 'Detallado exterior', 'Pick up gris con la pintura brillante'),
 ('interior-desarmado', 'Limpieza profunda', 'Interior a fondo', 'Técnico de Monzú desarmando la consola para limpiar a fondo el interior'),
]
os.makedirs(OUT + '/vid', exist_ok=True); os.makedirs(OUT + '/img', exist_ok=True)
for viejo in os.listdir(OUT + '/img'): os.remove(OUT + '/img/' + viejo)
for viejo in os.listdir(OUT + '/vid'): os.remove(OUT + '/vid/' + viejo)
def archivo(src, dst_dir, nombre, ext):
    b = open(src, 'rb').read(); nom = '%s-monzu-detallados.%s.%s' % (nombre, hashlib.sha256(b).hexdigest()[:8], ext)
    open(OUT + '/' + dst_dir + '/' + nom, 'wb').write(b); return '/' + dst_dir + '/' + nom
celdas = []
for i, (f, tit, sub, alt) in enumerate(TRAB):
    if f.startswith('vid:'):
        n = f[4:]; mp4 = archivo(M + 'vid/' + n + '.mp4', 'vid', n, 'mp4'); webm = archivo(M + 'vid/' + n + '.webm', 'vid', n, 'webm'); pos = archivo(M + 'vid/' + n + '.jpg', 'vid', n, 'jpg')
        celdas.append('<figure class="clip rv"><video poster="%s" muted loop playsinline preload="none" aria-label="%s"><source src="%s" type="video/mp4"><source src="%s" type="video/webm"></video><span class="tag-vid">▶ Video</span><figcaption class="cap"><small>%s</small><b>%s</b></figcaption></figure>' % (pos, alt, mp4, webm, sub, tit))
    else:
        src = archivo(M + 'img/trabajos/' + f + '.webp', 'img', f, 'webp')
        celdas.append('<button type="button" class="obra rv" data-titulo="%s"><img src="%s" alt="%s" loading="lazy" decoding="async"><span class="cap"><small>%s</small><b>%s</b></span></button>' % (tit, src, alt, sub, tit))
t, nn = re.subn(r'<div class="trabajos">.*?</div>\n  <p class="aviso-fotos">[^<]*</p>', lambda m: '<div class="trabajos">\n    ' + '\n    '.join(celdas) + '\n  </div>\n  <p class="aviso-fotos desliza">Deslice para ver más trabajos →</p>', t, count=1, flags=re.S); assert nn == 1
# videos de fondo en las tarjetas de los paquetes (oscurecidos para que se lea el texto)
for kp, nv in (('premium', 'lavado-espuma'), ('deluxe', 'llantin-hidrofobico')):
    mp4 = archivo(M + 'vid/' + nv + '.mp4', 'vid', nv, 'mp4'); webm = archivo(M + 'vid/' + nv + '.webm', 'vid', nv, 'webm'); pos = archivo(M + 'vid/' + nv + '.jpg', 'vid', nv, 'jpg')
    t, nn = re.subn(r'(<article class="paq[^"]*" data-paq="%s">)' % kp, lambda m: m.group(1) + '\n      <video class="paq-vid" poster="%s" muted loop playsinline preload="none" aria-hidden="true"><source src="%s" type="video/mp4"><source src="%s" type="video/webm"></video><div class="paq-velo" aria-hidden="true"></div>' % (pos, mp4, webm), t, count=1); assert nn == 1, kp
t = t.replace('</style>', '.paq-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-3;opacity:.55}\n.paq-velo{position:absolute;inset:0;z-index:-2;background:linear-gradient(180deg,rgba(7,9,11,.55),rgba(7,9,11,.88) 55%,rgba(7,9,11,.96))}\n.paq.deluxe .paq-velo{background:linear-gradient(180deg,rgba(7,9,11,.5),rgba(10,30,40,.86) 55%,rgba(7,9,11,.95))}\n</style>', 1)
t = rep(t, '<p>Toque una foto para verla en grande.</p></div>', '<p>Trabajos reales de Monzú en Cartago. Toque una foto para verla en grande.</p></div>')
# portada del juego "limpie el carro": la Tacoma recién detallada
t = rep(t, '<img src="{{IMG:deluxe}}" alt="Técnico de Monzú Detallados puliendo un carro negro" width="704" height="609" fetchpriority="high">',
        '<img src="%s" alt="Pick up negra recién detallada por Monzú, con la pintura brillante" width="704" height="609" fetchpriority="high">' % archivo(M + 'img/limpia-tacoma.webp', 'img', 'pick-up-negra-detallada', 'webp'))
GAL_CSS = """
.trabajos{grid-template-columns:repeat(4,minmax(0,1fr))}
.trabajos .obra:first-child{grid-column:auto;aspect-ratio:4/5}
.clip{position:relative;margin:0;border-radius:22px;overflow:hidden;background:var(--n3);aspect-ratio:4/5}
.clip video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.clip .cap{position:absolute;left:20px;right:20px;bottom:18px;z-index:2}
.clip::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(7,9,11,.92));pointer-events:none}
.clip small{display:block;font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--tq)}
.clip b{font-family:var(--t);font-weight:800;font-style:italic;font-size:1.7rem;text-transform:uppercase;line-height:1;color:var(--bl)}
.tag-vid{position:absolute;top:12px;left:12px;z-index:2;font-size:.7rem;font-weight:800;letter-spacing:.06em;padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);color:#fff}
.desliza{display:none}
@media(max-width:820px){
  .trabajos{display:grid;grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:72%;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:6px;scrollbar-width:none}
  .trabajos::-webkit-scrollbar{display:none}
  .trabajos > *{scroll-snap-align:start}
  .trabajos .obra:first-child{grid-column:auto;aspect-ratio:4/5}
  .desliza{display:block}
}
"""
t = t.replace('</style>', GAL_CSS + '</style>', 1)
# ---------------- SEO: título, datos para Google y preguntas frecuentes ----------------
t = re.sub(r'<title>.*?</title>', '<title>Lavado y detallado de carros a domicilio en Cartago | Monzú Detallados</title>', t, count=1)
t = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Lavado y detallado de carros a domicilio en Cartago, Costa Rica. Detallado Premium y Deluxe con sellado cerámico, limpieza de motor y tapicería. Reserve en línea su hora en 1 minuto.">', t, count=1)
t = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="Monzú Detallados · Lavado y detallado a domicilio en Cartago">', t, count=1)
t = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="Su carro como nuevo, sin salir de casa. Reserve en línea y junte sellos para su lavado gratis.">', t, count=1)
t = rep(t, '<meta property="og:type" content="website">', '<meta property="og:type" content="website">\n<meta property="og:locale" content="es_CR">\n<meta property="og:site_name" content="Monzú Detallados">\n<meta name="geo.region" content="CR-C">\n<meta name="geo.placename" content="Cartago, Costa Rica">')
CAT_BASE = {'paq': {'premium': {'n': 'Detallado Premium', 'sedan': 16000, 'suv': 18000, 'incluye': BASE_INC['premium']}, 'deluxe': {'n': 'Detallado Deluxe', 'sedan': 32000, 'suv': 35000, 'incluye': BASE_INC['deluxe']}},
            'ext': {'motor': {'n': 'Limpieza de motor', 'p': 8000}, 'asientos': {'n': 'Limpieza de asientos', 'p': 25000}, 'techo': {'n': 'Limpieza de techo', 'p': 10000}, 'tapiceria': {'n': 'Tapicería completa', 'p': 30000}, 'colchon': {'n': 'Limpieza de colchón', 'p': 10000}}}
P = CAT_BASE['paq']; X = CAT_BASE['ext']
FAQ = [
 ('¿Llegan hasta mi casa?', 'Sí. Monzú Detallados es un servicio de lavado y detallado a domicilio en Cartago: llegamos a su casa u oficina con todo el equipo y los productos. El domicilio se cobra aparte y depende de la ubicación del vehículo.'),
 ('¿Cuánto cuesta lavar el carro?', 'El Detallado Premium cuesta ₡%s en sedán y ₡%s en SUV o pick up. El Detallado Deluxe, con sellado cerámico de 10 meses, cuesta ₡%s en sedán y ₡%s en SUV o pick up. Los precios no incluyen el domicilio.' % tuple(format(v, ',').replace(',', '.') for v in (P['premium']['sedan'], P['premium']['suv'], P['deluxe']['sedan'], P['deluxe']['suv']))),
 ('¿Qué incluye el Detallado Premium?', ' '.join(x.rstrip('.') + '.' for x in P['premium']['incluye'])),
 ('¿Qué incluye el Detallado Deluxe?', 'Todo el Detallado Premium, más: ' + ', '.join(x.lower() for x in P['deluxe']['incluye'][1:]) + '.'),
 ('¿Cómo reservo una cita?', 'En esta misma página: elija el paquete, el día y la hora libre, y su cita queda reservada al instante. Además le creamos su tarjeta Monzú Club y le confirmamos por WhatsApp.'),
 ('¿Cómo puedo pagar?', 'En efectivo, SINPE Móvil o transferencia, al terminar el servicio.'),
 ('¿Puedo cambiar o cancelar mi cita?', 'Sí, desde su tarjeta Monzú Club hasta 2 horas antes. Si no se presenta sin avisar, se cobra una multa de ₡5.000 en su próximo lavado.'),
 ('¿Qué es Monzú Club?', 'Es la tarjeta de cliente frecuente: por cada lavado suma un sello y con 10 sellos su Lavado Premium sale gratis. La guarda en el celular sin descargar nada.'),
]
FAQ_HTML = '''<section id="preguntas"><div class="wrap">
  <div class="cab rv"><div><span class="eti">Preguntas frecuentes</span><h2 class="t">Todo lo que<br><span class="tq">quiere saber</span></h2></div>
    <p>Lavado y detallado de carros a domicilio en Cartago, Costa Rica.</p></div>
  <div class="faq">%s</div>
</div></section>

''' % ''.join('<details class="faq-i rv"><summary><h3>%s</h3></summary><p>%s</p></details>' % q for q in FAQ)
for kx, vx in (('premium-sedan', P['premium']['sedan']), ('premium-suv', P['premium']['suv']), ('deluxe-sedan', P['deluxe']['sedan']), ('deluxe-suv', P['deluxe']['suv'])):
    FAQ_HTML = FAQ_HTML.replace('₡' + format(vx, ',').replace(',', '.') + ' ', '<b data-inc-precio="%s">₡%s</b> ' % (kx, format(vx, ',').replace(',', '.')), 1)
t = rep(t, '<section id="contacto">', FAQ_HTML + '<section id="contacto">')
t = rep(t, '<li><a href="#club">Monzú Club</a></li>', '<li><a href="#preguntas">Preguntas</a></li><li><a href="#club">Monzú Club</a></li>')
FAQ_CSS = """
.faq{display:grid;gap:10px;max-width:860px}
.faq-i{background:var(--n2);border:1px solid var(--linea2);border-radius:18px;padding:4px 18px}
.faq-i summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 0}
.faq-i summary::-webkit-details-marker{display:none}
.faq-i summary::after{content:"+";font-size:1.5rem;color:var(--tq);flex:none;transition:transform .3s}
.faq-i[open] summary::after{transform:rotate(45deg)}
.faq-i h3{font-size:1.02rem;font-weight:700;font-family:var(--s)}
.faq-i p{color:var(--gr);padding:0 0 16px;line-height:1.6}
"""
t = t.replace('</style>', FAQ_CSS + '</style>', 1)
# datos estructurados (lo que Google lee del negocio)
def oferta(n, precio, desc=None):
    o = {"@type": "Offer", "price": str(precio), "priceCurrency": "CRC", "itemOffered": {"@type": "Service", "name": n}}
    if desc: o["itemOffered"]["description"] = desc
    return o
negocio = {"@type": "AutoWash", "@id": DOM + "/#negocio", "name": "Monzú Detallados", "url": DOM + "/", "logo": DOM + "/icono-512.png", "image": [DOM + "/og.jpg"],
  "description": "Lavado y detallado profesional de carros a domicilio en Cartago, Costa Rica: Detallado Premium, Deluxe con sellado cerámico, limpieza de motor, asientos, techo y tapicería.",
  "telephone": "+506-7268-6906", "priceRange": "₡₡", "currenciesAccepted": "CRC", "paymentAccepted": "Efectivo, SINPE Móvil, Transferencia",
  "address": {"@type": "PostalAddress", "addressLocality": "Cartago", "addressRegion": "Cartago", "addressCountry": "CR"},
  "areaServed": [{"@type": "City", "name": "Cartago"}, {"@type": "AdministrativeArea", "name": "Provincia de Cartago"}],
  "founder": {"@type": "Person", "name": "Isaac Monge"},
  "potentialAction": {"@type": "ReserveAction", "target": DOM + "/#agendar", "name": "Reservar una cita"},
  "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Servicios de detallado", "itemListElement":
     [oferta(P[k]['n'] + ' (sedán)', P[k]['sedan'], '. '.join(P[k]['incluye'])) for k in ('premium', 'deluxe')] +
     [oferta(P[k]['n'] + ' (SUV o pick up)', P[k]['suv']) for k in ('premium', 'deluxe')] +
     [oferta(x['n'], x['p']) for x in X.values()]}}
grafo = {"@context": "https://schema.org", "@graph": [negocio,
  {"@type": "WebSite", "@id": DOM + "/#sitio", "url": DOM + "/", "name": "Monzú Detallados", "inLanguage": "es-CR", "publisher": {"@id": DOM + "/#negocio"}},
  {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}]}
t = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">' + json.dumps(grafo, ensure_ascii=False) + '</script>', t, count=1, flags=re.S)
t = t.replace('{{FECHA}}', FECHA)
imgs = {'logo': uri('logo.webp', 'image/webp'), 'fav64': uri('fav64.png', 'image/png'), 'fav180': uri('fav180.png', 'image/png')}
for k in ['deluxe', 'motor', 'tapiceria', 'scents1', 'scents2', 'scents3']: imgs[k] = uri(k + '.webp', 'image/webp')
# fotos como archivos aparte (la página carga más rápido y Google puede verlas en Imágenes)
os.makedirs(OUT + '/img', exist_ok=True)
IMGF = {}
for k, (f, ext) in {'logo': ('logo.webp', 'webp'), 'fav64': ('fav64.png', 'png'), 'fav180': ('fav180.png', 'png'), **{x: (x + '.webp', 'webp') for x in ['deluxe', 'motor', 'tapiceria', 'scents1', 'scents2', 'scents3']}}.items():
    b = open(M + 'img/' + f, 'rb').read(); nom = '%s-monzu-detallados.%s.%s' % ({'deluxe': 'detallado-deluxe-cartago', 'motor': 'limpieza-de-motor', 'tapiceria': 'limpieza-de-tapiceria'}.get(k, k), hashlib.sha256(b).hexdigest()[:8], ext)
    open(OUT + '/img/' + nom, 'wb').write(b); IMGF[k] = '/img/' + nom
t = re.sub(r'\{\{IMG:(\w+)\}\}', lambda m: IMGF[m.group(1)], t)
def qr_svg(u):
    b = io.BytesIO(); segno.make(u, error='m').save(b, kind='svg', scale=4, border=1, dark='#07090B', xmldecl=False, svgns=True, omitsize=True); return b.getvalue().decode()
t = t.replace('{{QR_RESENA}}', qr_svg('https://www.google.com/maps/search/Monzu+Detallados+Cartago')).replace('{{QR_WEB}}', qr_svg('https://ssolanotech.com'))
t = t.replace('{{WA}}', 'https://wa.me/50672686906?text=Hola%20Monz%C3%BA%20Detallados%2C%20quiero%20informaci%C3%B3n%20para%20un%20detallado')
assert not re.search(r'\{\{|__JS__', t) and ' style="' not in t
OSM = ' https://tile.openstreetmap.org'
NOMI = " https://nominatim.openstreetmap.org"
csp_index = csp_de(t, extra_script=" 'self'", img="'self' data:" + OSM, connect="'self'" + NOMI).replace("manifest-src 'self'", "manifest-src 'self'; media-src 'self'")
open(OUT + '/index.html', 'w', encoding='utf-8').write(con_csp(t, csp_index))
# ---------------- páginas legales sueltas (Meta las pide para aprobar la cuenta de WhatsApp) ----------------
NEGOCIO = '<p class="neg"><b>Monzú Detallados</b> · Responsable: Isaac Monge · Detallado de vehículos a domicilio · Cartago, Costa Rica · WhatsApp y teléfono <a href="tel:+50672686906">7268-6906</a> · <a href="%s/">%s</a></p>' % (DOM, DOM.replace('https://', ''))
def cuerpo_dialogo(html, ident):
    m = re.search(r'<dialog class="legal" id="dlg-%s"[^>]*>.*?<div class="lg-body">(.*?)</div>\s*</dialog>' % ident, html, re.S); assert m, ident
    return re.sub(r'<button type="button" data-legal="[a-z]+">([^<]*)</button>', r'\1', m.group(1)).strip()
LEGAL_CSS = FUENTES + '''*{box-sizing:border-box;margin:0;padding:0}
body{background:#07090B;color:#F3F7FA;font:400 1rem/1.6 "Inter",system-ui,sans-serif;padding:28px 18px 60px}
main{max-width:760px;margin:0 auto;display:grid;gap:14px}
a{color:#8BE3EE}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.top img{height:46px;width:auto}
h1{font-family:"Exo 2",sans-serif;font-style:italic;font-weight:900;text-transform:uppercase;font-size:clamp(1.8rem,6vw,2.6rem);line-height:1.05}
h3{font-family:"Exo 2",sans-serif;font-weight:800;font-size:1.15rem;margin-top:10px;color:#8BE3EE}
p,li{color:#C9D3DB}ul,ol{padding-left:22px;display:grid;gap:6px}
.neg{background:#141A20;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;font-size:.92rem}
.pie{font-size:.85rem;color:#A2AEB9;border-top:1px solid rgba(255,255,255,.1);padding-top:14px;display:flex;gap:14px;flex-wrap:wrap}
'''
def pagina_legal(titulo, cont, ruta):
    html = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>%s · Monzú Detallados</title>\n'
            '<meta name="description" content="%s de Monzú Detallados, detallado de vehículos a domicilio en Cartago, Costa Rica.">\n<link rel="canonical" href="%s/%s">\n<link rel="icon" type="image/png" href="%s">\n<style>\n%s</style>\n</head>\n<body>\n<main>\n'
            '<div class="top"><a href="/"><img src="%s" alt="Monzú Detallados" width="640" height="322"></a><a href="/">← Volver a la página</a></div>\n<h1>%s</h1>\n%s\n%s\n<p>Última actualización: %s.</p>\n'
            '<nav class="pie"><a href="/terminos">Términos y condiciones</a><a href="/privacidad">Política de privacidad</a><a href="/eliminar-datos">Eliminar mis datos</a><a href="/#contacto">Contacto</a></nav>\n</main>\n</body>\n</html>\n') % (
            titulo, titulo, DOM, ruta, imgs['fav180'], LEGAL_CSS, imgs['logo'], titulo, NEGOCIO, cont, FECHA)
    est = re.findall(r'<style>(.*?)</style>', html, re.S)
    csp = "; ".join(["default-src 'none'", "style-src " + " ".join(h(e) for e in est), "font-src 'self'", "img-src 'self' data:", "form-action 'none'", "base-uri 'none'", "frame-ancestors 'none'", "upgrade-insecure-requests"])
    open('%s/%s.html' % (OUT, ruta), 'w', encoding='utf-8').write(con_csp(html, csp)); return csp
BORRAR = '''<p>Usted puede pedir en cualquier momento que borremos todos sus datos: nombre, teléfono, carro, dirección, ubicación, citas, sellos y el número de WhatsApp al que le enviamos recordatorios.</p>
<h3>Opción 1: usted mismo, desde su tarjeta</h3><ol><li>Entre a <a href="/tarjeta">su tarjeta Monzú Club</a> con su teléfono y su PIN.</li><li>Abajo toque <b>“Borrar mi tarjeta y mis datos”</b> y confirme con su PIN.</li><li>Se borran al instante su tarjeta, sus sellos, su historial y sus citas.</li></ol>
<h3>Opción 2: pídanoslo por WhatsApp</h3><p>Escriba “Quiero borrar mis datos” al <a href="https://wa.me/50672686906?text=Quiero%20borrar%20mis%20datos%20de%20Monz%C3%BA%20Detallados">7268-6906</a> desde el número con el que agendó. Los borramos en un plazo máximo de 5 días hábiles, como indica la Ley 8968, y le confirmamos por el mismo medio.</p>
<h3>Dejar de recibir recordatorios por WhatsApp</h3><p>Responda <b>“NO”</b> a cualquier recordatorio o escríbanos, y dejamos de enviarle mensajes automáticos. Solo le escribiremos si usted nos escribe primero.</p>
<h3>Facebook e Instagram</h3><p>Este sitio no usa inicio de sesión con Facebook ni recibe datos de su cuenta de Facebook. Si nos escribió por Facebook o WhatsApp, puede borrar esa conversación desde la propia aplicación.</p>'''
csp_legal = {}
csp_legal['terminos'] = pagina_legal('Términos y condiciones', cuerpo_dialogo(t, 'terminos'), 'terminos')
csp_legal['privacidad'] = pagina_legal('Política de privacidad', cuerpo_dialogo(t, 'privacidad'), 'privacidad')
csp_legal['eliminar-datos'] = pagina_legal('Eliminación de datos', BORRAR, 'eliminar-datos')


# ---------------- 2) tarjeta y 3) panel ----------------
comun = {'{{LOGO}}': imgs['logo'], '{{FAV}}': imgs['fav180'], '{{FECHA}}': FECHA, '"/js/mapa.js"': '"/js/%s"' % MAPA}
csps = {}
for pag in ('tarjeta', 'panel'):
    p = open(A + pag + '.tpl.html', encoding='utf-8').read()
    p = sin_google(p.replace('__JS__', open(A + pag + '.js', encoding='utf-8').read()))
    for k, v in comun.items(): p = p.replace(k, v)
    assert not re.search(r'\{\{|__JS__', p) and ' style="' not in p, pag
    csps[pag] = csp_de(p, extra_script=" 'self'", img="'self' data: blob:" if pag == 'panel' else "'self' data:" + OSM,
                       tt_pol="monzu-sw" if pag == 'tarjeta' else "'none'", worker=pag == 'tarjeta', connect="'self'" + (NOMI if pag == 'tarjeta' else ''))
    open('%s/%s.html' % (OUT, pag), 'w', encoding='utf-8').write(con_csp(p, csps[pag]))

# service worker de la tarjeta (recordatorios por notificación)
shutil.copy(A + 'sw.js', OUT + '/sw.js')

# ---------------- demostración con dos celulares (para enseñarle al dueño, sin contraseña) ----------------
demo = open(A + '../../../monzu-club-demo/index.html', encoding='utf-8').read()
demo = demo.replace('Demostración hecha por Solanotech para Monzú Detallados', 'Demostración de Monzú Club · <a href="/">ver la página de Monzú</a>', 1)
demo = demo.replace('.demobar{', '.demobar a{color:inherit;text-decoration:underline}\n.demobar{', 1)
demo = sin_google(demo)
csp_demo = csp_de(demo, connect="'none'", tt=False)  # demo sin datos ni formularios: dibuja íconos con innerHTML
open(OUT + '/demo.html', 'w', encoding='utf-8').write(con_csp(demo, csp_demo))

# ---------------- imagen para compartir (WhatsApp / Facebook) y sitemap ----------------
og = Image.open(M + 'img/portada.png').convert('RGB'); w, hh = og.size; esc = max(1200 / w, 630 / hh)
og = og.resize((int(w * esc), int(hh * esc))); x0 = (og.width - 1200) // 2; y0 = (og.height - 630) // 2; og = og.crop((x0, y0, x0 + 1200, y0 + 630))
velo = Image.new('RGBA', (1200, 630), (7, 9, 11, 0)); from PIL import ImageDraw
dv = ImageDraw.Draw(velo)
for xx in range(1200): dv.line([(xx, 0), (xx, 630)], fill=(7, 9, 11, int(235 * max(0, 1 - xx / 760))))
og = Image.alpha_composite(og.convert('RGBA'), velo); l = logo.copy(); l.thumbnail((520, 300)); og.paste(l, (70, (630 - l.height) // 2), l)
og.convert('RGB').save(OUT + '/og.jpg', quality=86)
open(OUT + '/sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>%s/</loc><lastmod>%s</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url><url><loc>%s/privacidad</loc></url><url><loc>%s/terminos</loc></url><url><loc>%s/eliminar-datos</loc></url></urlset>\n' % (DOM, __import__('datetime').date.today().isoformat(), DOM, DOM, DOM))

# ---------------- cabeceras y robots ----------------
base = "  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Resource-Policy: same-origin\n  X-Permitted-Cross-Domain-Policies: none\n"
sin_cam = "  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(), usb=()\n"
hd = ''
for ruta, csp, extra in [('/', csp_index, sin_cam), ('/index.html', csp_index, sin_cam), ('/demo', csp_demo, sin_cam + "  X-Robots-Tag: noindex\n"), ('/demo.html', csp_demo, sin_cam + "  X-Robots-Tag: noindex\n"),
                         ('/tarjeta.html', csps['tarjeta'], sin_cam + "  X-Robots-Tag: noindex\n"), ('/tarjeta', csps['tarjeta'], sin_cam + "  X-Robots-Tag: noindex\n"),
                         ('/panel.html', csps['panel'], "  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n"),
                         ('/panel', csps['panel'], "  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=()\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n")]:
    hd += ruta + "\n  Content-Security-Policy: " + csp + "\n" + base + extra
for k, c in csp_legal.items():
    for ruta in ('/' + k, '/' + k + '.html'): hd += ruta + "\n  Content-Security-Policy: " + c + "\n" + base + sin_cam
hd += "/sw.js\n  Cache-Control: no-cache\n  Content-Security-Policy: default-src 'none'; img-src 'self'\n  X-Content-Type-Options: nosniff\n"
hd += "/vid/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n"
hd += "/img/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Content-Type-Options: nosniff\n"
hd += "/js/*\n  Cache-Control: public, max-age=604800\n  X-Content-Type-Options: nosniff\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n"
open(OUT + '/_headers', 'w').write(hd)
open(OUT + '/robots.txt', 'w').write('User-agent: *\nAllow: /\nDisallow: /demo\nDisallow: /panel.html\nDisallow: /panel\nDisallow: /tarjeta.html\nDisallow: /api/\nSitemap: %s/sitemap.xml\n' % DOM)
print('listo ->', OUT, {f: os.path.getsize(OUT + '/' + f) for f in os.listdir(OUT) if f.endswith('.html')})
