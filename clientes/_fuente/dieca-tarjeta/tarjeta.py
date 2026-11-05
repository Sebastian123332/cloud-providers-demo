"""Tarjeta de presentación de Grúas DIECA S.A. (frente y reverso, 3.5 x 2 pulgadas)."""
import os
D = os.path.dirname(os.path.abspath(__file__)) + '/'
F = '/home/user/cloud-providers-demo/clientes/_fuente/dieca-proforma/'
QR = open(D + 'qr.svg', encoding='utf-8').read().replace('<svg ', '<svg class="qr" ', 1)

MARCA = '''<svg class="marca" viewBox="10 10 144 118" aria-hidden="true">
  <g transform="translate(30 26) rotate(35)">
    <rect x="62" y="-11" width="78" height="22" rx="2" fill="{or}"/>
    <rect x="35" y="-9" width="25" height="18" rx="2" fill="{ink}"/>
    <rect x="11" y="-7" width="22" height="14" rx="2" fill="{ink}"/>
  </g>
  <circle cx="30" cy="26" r="10" fill="{ink}"/><circle cx="30" cy="26" r="3.5" fill="{hueco}"/>
  <path d="M25 35V70M35 35V70" stroke="{ink}" stroke-width="3"/>
  <path d="M17 70h26v20l-13 11l-13-11z" fill="{ink}"/>
  <circle cx="23.5" cy="78" r="2.6" fill="{hueco}"/><circle cx="36.5" cy="78" r="2.6" fill="{hueco}"/><circle cx="30" cy="87" r="3" fill="{hueco}"/>
  <path d="M30 101v7a8 8 0 1 1-8 8" fill="none" stroke="{ink}" stroke-width="4.5" stroke-linecap="round"/>
</svg>'''

ICO = {
 'tel': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
 'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
 'dir': '<path d="M12 22s8-7.6 8-13a8 8 0 0 0-16 0c0 5.4 8 13 8 13z"/><circle cx="12" cy="9" r="3"/>',
 'web': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
 'doc': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
}
def ico(k): return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % ICO[k]

CSS = '''
@font-face{font-family:Titulo;src:url(%ssub2.ttf)}
@font-face{font-family:Texto;font-weight:400;src:url(%ssub0.ttf)}
@font-face{font-family:Texto;font-weight:700;src:url(%ssub1.ttf)}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1050px;height:600px;overflow:hidden;font-family:Texto,Arial,sans-serif}
.cara{position:relative;width:1050px;height:600px;overflow:hidden}
.cinta{position:absolute;left:0;right:0;height:46px;background:repeating-linear-gradient(-45deg,#111214 0 34px,#F4B400 34px 68px)}
/* frente */
.frente{background:radial-gradient(700px 500px at 85%% 10%%,#FFD24D,transparent 60%%),#F4B400;color:#111214}
.frente .cinta{bottom:0}
.frente .bloque{position:absolute;left:84px;top:78px;display:flex;align-items:center;gap:34px}
.frente .marca{width:250px;height:205px;transform:rotate(-8deg)}
.nombre{font-family:Titulo;text-transform:uppercase;line-height:.82;letter-spacing:.01em}
.nombre small{display:block;font-size:64px}
.nombre b{display:block;font-size:150px;font-weight:normal}
.nombre em{font-style:normal;font-size:52px;margin-left:10px}
.lema{position:absolute;left:84px;right:84px;top:372px;display:flex;justify-content:space-between;align-items:center;border-top:4px solid #111214;padding-top:18px}
.lema span{font-family:Titulo;font-size:38px;text-transform:uppercase;letter-spacing:.04em}
.lema i{font-style:normal;background:#111214;color:#F4B400;font-family:Titulo;font-size:40px;padding:6px 18px;border-radius:8px;letter-spacing:.06em}
.lema2{position:absolute;left:84px;top:455px;font-size:26px;font-weight:700;color:#2B271C}
/* reverso */
.reverso{background:#111214;color:#F5F2E8}
.reverso .cinta{top:0}
.reverso .cab{position:absolute;left:70px;top:88px;display:flex;align-items:center;gap:18px}
.reverso .marca{width:92px;height:76px}
.reverso .cab .nombre small{font-size:30px;color:#F4B400}
.reverso .cab .nombre b{font-size:64px;color:#F4B400}
.reverso .cab .nombre em{font-size:26px}
.persona{position:absolute;left:70px;top:205px}
.persona b{display:block;font-family:Titulo;font-size:46px;text-transform:uppercase;letter-spacing:.02em;line-height:1}
.persona span{display:block;font-size:22px;color:#C9C2AE;margin-top:6px}
.datos{position:absolute;left:70px;top:300px;display:grid;gap:15px}
.datos div{display:flex;align-items:center;gap:16px;font-size:25px}
.datos .ico{width:30px;height:30px;color:#F4B400;flex:none}
.datos b{font-weight:700}
.qrcaja{position:absolute;right:66px;top:118px;width:268px;background:#F5F2E8;border-radius:20px;padding:20px 20px 14px;text-align:center;color:#111214}
.qrcaja .qr{width:228px;height:228px;display:block}
.qrcaja p{font-family:Titulo;font-size:27px;text-transform:uppercase;margin-top:10px;letter-spacing:.03em}
.qrcaja small{display:block;font-size:17px;color:#2B271C;font-weight:700}
.g247{position:absolute;right:66px;bottom:44px;font-family:Titulo;font-size:40px;color:#F4B400;letter-spacing:.04em}
''' % (F, F, F)

def pagina(cuerpo):
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s</style></head><body>%s</body></html>' % (CSS, cuerpo)

frente = pagina('''<div class="cara frente">
  <div class="bloque">%s
    <div class="nombre"><small>Grúas</small><b>DIECA<em>S.A.</em></b></div></div>
  <div class="lema"><span>Grúa telescópica · Transporte pesado</span><i>24/7</i></div>
  <p class="lema2">Servicio de grúa en todo Costa Rica</p>
  <div class="cinta"></div>
</div>''' % MARCA.format(ink='#111214', hueco='#F4B400', **{'or': '#8F2A00'}))

reverso = pagina('''<div class="cara reverso">
  <div class="cinta"></div>
  <div class="cab">%s<div class="nombre"><small>Grúas</small><b>DIECA<em>S.A.</em></b></div></div>
  <div class="persona"><b>Luis Diego Olivares</b><span>Representante legal</span></div>
  <div class="datos">
    <div>%s<span><b>8854-4150</b> · teléfono y WhatsApp</span></div>
    <div>%s<span>dquiros811@gmail.com</span></div>
    <div>%s<span>Residencial Cartago, Casa 21F</span></div>
    <div>%s<span><b>gruadieca.com</b></span></div>
    <div>%s<span>Cédula jurídica 3-101-712098</span></div>
  </div>
  <div class="qrcaja">%s<p>Cotice en línea</p><small>gruadieca.com</small></div>
  <div class="g247">ATENCIÓN 24/7</div>
</div>''' % (MARCA.format(ink='#F4B400', hueco='#111214', **{'or': '#C8102E'}), ico('tel'), ico('mail'), ico('dir'), ico('web'), ico('doc'), QR))

open(D + 'frente.html', 'w', encoding='utf-8').write(frente)
open(D + 'reverso.html', 'w', encoding='utf-8').write(reverso)
print('ok')
