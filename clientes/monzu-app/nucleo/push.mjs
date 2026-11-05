// Notificaciones Web Push (RFC 8291 cifrado aes128gcm + RFC 8292 VAPID) solo con WebCrypto.
// Sirve en Cloudflare Workers y en Node 20+. No usa librerías externas.
const S = globalThis.crypto.subtle;
const te = new TextEncoder();

export const b64u = (bytes) => {
  let s = ''; const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const deB64u = (str) => {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
};
const une = (...partes) => { const n = partes.reduce((a, p) => a + p.length, 0), o = new Uint8Array(n); let i = 0; for (const p of partes) { o.set(p, i); i += p.length; } return o; };
async function hmac(clave, datos) {
  const k = await S.importKey('raw', clave, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await S.sign('HMAC', k, datos));
}

/** Crea un par de llaves VAPID (se guarda una sola vez en la base de datos). */
export async function nuevaVapid() {
  const k = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return { pub: b64u(await S.exportKey('raw', k.publicKey)), jwk: await S.exportKey('jwk', k.privateKey) };
}

/** Cifra el mensaje para una suscripción (aes128gcm, un solo registro). */
export async function cifrar(p256dh, auth, texto) {
  const ua = deB64u(p256dh), secreto = deB64u(auth);
  if (ua.length !== 65 || secreto.length !== 16) throw new Error('suscripción inválida');
  const eph = await S.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await S.exportKey('raw', eph.publicKey));
  const uaKey = await S.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const compartido = new Uint8Array(await S.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const prkClave = await hmac(secreto, compartido);
  const ikm = await hmac(prkClave, une(te.encode('WebPush: info\0'), ua, asPub, new Uint8Array([1])));
  const sal = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(sal, ikm);
  const cek = (await hmac(prk, une(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, une(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const k = await S.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cifrado = new Uint8Array(await S.encrypt({ name: 'AES-GCM', iv: nonce }, k, une(te.encode(texto), new Uint8Array([2]))));
  const cabecera = une(sal, new Uint8Array([0, 0, 16, 0]), new Uint8Array([65]), asPub); // rs = 4096
  return une(cabecera, cifrado);
}

/** Firma VAPID (JWT ES256) para el servicio de push del navegador. */
export async function firmaVapid(endpoint, vapid, contacto) {
  const aud = new URL(endpoint).origin;
  const cab = b64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const cuerpo = b64u(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: contacto })));
  const k = await S.importKey('jwk', vapid.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const firma = await S.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, te.encode(cab + '.' + cuerpo));
  return 'vapid t=' + cab + '.' + cuerpo + '.' + b64u(firma) + ', k=' + vapid.pub;
}

/** Solo se aceptan servicios de push conocidos (evita que usen el servidor para llamar a otros sitios). */
export function endpointValido(e) {
  try {
    const u = new URL(e);
    return u.protocol === 'https:' && /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/.test(u.hostname);
  } catch { return false; }
}

/** Envía una notificación. Devuelve el código HTTP del servicio de push (201 = enviada, 404/410 = ya no existe). */
export async function enviarPush(sub, mensaje, vapid, contacto, fetchFn = fetch) {
  if (!endpointValido(sub.endpoint)) return 400;
  const cuerpo = await cifrar(sub.keys.p256dh, sub.keys.auth, JSON.stringify(mensaje));
  const r = await fetchFn(sub.endpoint, {
    method: 'POST',
    headers: { authorization: await firmaVapid(sub.endpoint, vapid, contacto), 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '86400', urgency: 'high' },
    body: cuerpo,
  });
  return r.status;
}
