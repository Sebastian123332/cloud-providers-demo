# Arma la página final: mete las fotos, la fecha y una CSP con hashes del CSS y JS en línea.
import re, sys, os, hashlib, base64, pathlib
tpl, src, out, extra_connect = sys.argv[1], sys.argv[2], sys.argv[3], (sys.argv[4] if len(sys.argv) > 4 else "'none'")
s = open(src, encoding='utf-8').read()
imgs = re.findall(r'data:image/[a-z+]+;base64,[A-Za-z0-9+/=]+', s)
t = open(tpl, encoding='utf-8').read()
t = t.replace("d.querySelector('.lg-body').scrollTop=0;", "d.scrollTop=0;").replace('{{FECHA}}', '20 de octubre de 2026')
for i, im in enumerate(imgs): t = t.replace('{{IMG%d}}' % i, im)
assert not re.findall(r'\{\{[A-Z0-9]+\}\}', t)
assert ' style="' not in t, 'quedan estilos en línea'
h = lambda x: "'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf-8')).digest()).decode() + "'"
estilos = re.findall(r'<style>(.*?)</style>', t, re.S)
scripts = re.findall(r'<script>(.*?)</script>', t, re.S)
assert len(scripts) == 1, len(scripts)
csp = "; ".join([
  "default-src 'none'",
  "script-src " + h(scripts[0]) + ((" " + os.environ["EXTRA_SCRIPT"]) if os.environ.get("EXTRA_SCRIPT") else ""),
  "style-src " + " ".join(h(e) for e in estilos) + " https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:" + ((" " + os.environ["EXTRA_IMG"]) if os.environ.get("EXTRA_IMG") else ""),
  "connect-src " + extra_connect,
  "form-action 'none'", "base-uri 'none'", "object-src 'none'",
  "require-trusted-types-for 'script'", "trusted-types 'none'",
  "upgrade-insecure-requests",
])
meta = '<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n'
t = t.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + meta, 1)
assert meta in t
open(out, 'w', encoding='utf-8').write(t)
hdr = pathlib.Path(out).with_name('_headers')
hdr.write_text("""/*
  Content-Security-Policy: """ + csp + """; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Cross-Origin-Opener-Policy: same-origin
""", encoding='utf-8')
print(out, len(t))
