# Calcula los hashes del CSS y JS en línea y arma la política de seguridad (CSP).
import re, hashlib, base64, pathlib
aqui = pathlib.Path(__file__).parent
s = (aqui / 'index.src.html').read_text(encoding='utf-8')
def h(texto): return "'sha256-" + base64.b64encode(hashlib.sha256(texto.encode('utf-8')).digest()).decode() + "'"
estilos = re.findall(r'<style>(.*?)</style>', s, re.S)
scripts = re.findall(r'<script>(.*?)</script>', s, re.S)
assert len(estilos) == 1 and len(scripts) == 1
csp = "; ".join([
  "default-src 'none'",
  "script-src " + h(scripts[0]),
  "style-src " + h(estilos[0]) + " https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
  "upgrade-insecure-requests",
])
(aqui / 'index.html').write_text(s.replace('{{CSP}}', csp), encoding='utf-8')
(aqui / '_headers').write_text("""/*
  Content-Security-Policy: """ + csp + """; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Cross-Origin-Opener-Policy: same-origin
""", encoding='utf-8')
print(csp)
