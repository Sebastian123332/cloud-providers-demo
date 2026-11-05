// Monzú Detallados · API de reservas, Monzú Club y panel del dueño.
// Netlify Function (v2) + Netlify Blobs. Versión de producción con medidas de seguridad:
// - escrituras atómicas (sin pérdidas si dos personas reservan a la vez)
// - panel con sesión firmada (la contraseña nunca se guarda en el celular)
// - bloqueo global de intentos (contraseña del panel y PIN de clientes)
// - PIN cifrado con scrypt, IP guardada solo como huella (hash), límites diarios anti abuso
// - verificación de origen (anti CSRF), cabeceras seguras, bitácora de acciones del dueño
// Núcleo compartido: lo usan el adaptador de Netlify (netlify/functions/api.mjs) y el de Cloudflare (functions/api/[[ruta]].js).
import { randomBytes, timingSafeEqual, createHash, createHmac, scryptSync } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { nuevaVapid, enviarPush, endpointValido } from './push.mjs';

let A = null, ENV = {}, CFG = null; // almacén, variables y ajustes del dueño de la solicitud en curso

/* ---------- ajustes del negocio ---------- */
const AJUSTES = {
  meta: 10,                                   // sellos para el premio
  premio: 'Lavado Premium gratis',
  horas: ['08:00', '10:00', '13:00', '15:00'], // turnos de cita
  dias: [1, 2, 3, 4, 5, 6],                    // 0=domingo … 6=sábado
  diasAdelante: 45,
  zona: 'America/Costa_Rica',
  maxReservasDia: 40,                         // tope de reservas nuevas por día (anti abuso)
  maxRegistrosDia: 80,                        // tope de registros nuevos por día (anti abuso)
  diasCitas: 120,                             // las citas se borran a los 4 meses
  multa: 5000,                                // multa si el cliente no llega (se cobra en la próxima cita)
  horasCancelar: 2,                           // el cliente puede cancelar gratis hasta 2 horas antes
  pagos: ['Efectivo', 'SINPE Móvil', 'Transferencia'],
};
const inicioCita = (c) => Date.parse(c.fecha + 'T' + c.hora + ':00-06:00'); // Costa Rica: UTC-6 todo el año

/* ---------- precios oficiales: el servidor calcula el total, no confía en el navegador ---------- */
const RESENA_BASE = 'https://www.google.com/maps/search/?api=1&query=Monz%C3%BA+Detallados+Cartago';
const CATALOGO = {
  paq: {
    premium: { n: 'Detallado Premium', sedan: 16000, suv: 18000, incluye: ['Aspirado profundo y limpieza de plásticos internos, con restaurador e hidratante para plásticos y cuero', 'Pre-lavado para quitar la suciedad sin rayar, y lavado con shampoo pH neutro que cuida los cerámicos', 'Limpieza y detallado de llantas, aros y guardabarros, con hidrofobia (repelencia)', 'Detallado de vidrios con repelencia', 'Cera cerámica'] },
    deluxe: { n: 'Detallado Deluxe', sedan: 32000, suv: 35000, incluye: ['Todo el Detallado Premium, más:', 'Limpieza minuciosa del interior', 'Eliminación de manchas superficiales en asientos y puertas', 'Descontaminación de pintura', 'Sellado cerámico de 10 meses', 'Restaurador de partes negras externas', 'Aromatizante, si lo desea'] },
  },
  ext: {
    motor: { n: 'Limpieza de motor', p: 8000, conPaq: 5000 }, asientos: { n: 'Limpieza de asientos', p: 25000 }, techo: { n: 'Limpieza de techo', p: 10000 },
    tapiceria: { n: 'Tapicería completa', p: 30000, desde: true }, colchon: { n: 'Limpieza de colchón', p: 10000 },
  },
};
// Ajustes que el dueño cambia desde el panel (horario, días cerrados, servicios y precios, enlace de reseñas).
const configBase = () => ({ horas: [...AJUSTES.horas], dias: [...AJUSTES.dias], cerrados: [], cat: JSON.parse(JSON.stringify(CATALOGO)), resena: RESENA_BASE });
async function cargaConfig() { const r = await A.leer('config'); CFG = { ...configBase(), ...((r && r.data) || {}) }; return CFG; }
const catPublico = () => ({ paq: CFG.cat.paq, ext: Object.fromEntries(Object.entries(CFG.cat.ext).filter(([, x]) => !x.oculto)) });
function cotiza(veh, paq, extras) {
  const v = veh === 'suv' ? 'suv' : 'sedan', lineas = []; let desde = false;
  const P = CFG.cat.paq[paq]; if (P) lineas.push([P.n + (v === 'sedan' ? ' · sedán' : ' · SUV/pick up'), P[v]]);
  [...new Set(Array.isArray(extras) ? extras.map(String) : [])].slice(0, 8).forEach((k) => {
    const x = CFG.cat.ext[k]; if (!x || x.oculto) return; if (x.desde) desde = true;
    lineas.push([x.n + (x.desde ? ' (desde)' : ''), x.conPaq && P ? x.conPaq : x.p]);
  });
  return { v, lineas, desde, total: lineas.reduce((a, l) => a + l[1], 0), vehiculo: v === 'sedan' ? 'Sedán' : 'SUV / Pick up / XL' };
}

/* ---------- almacenamiento con escritura atómica (el adaptador entrega leer/escribir con etag) ---------- */
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const vacia = () => ({ v: 2, clientes: {}, tokens: {}, citas: [], cuotas: {}, bitacora: [] });
async function leerDB(k = 'db') { const a = A; const r = await a.leer(k); return (r && r.data) || (k === 'db' ? vacia() : {}); }
// fn(db) devuelve { res, cambio }. Si otro escribió en medio, se repite con los datos nuevos.
async function transaccion(fn, k = 'db') {
  const a = A;
  for (let i = 0; i < 6; i++) {
    const r = await a.leer(k); const db = (r && r.data) || (k === 'db' ? vacia() : {});
    const out = await fn(db);
    if (!out.cambio) return out.res;
    if (await a.escribir(k, db, r && r.etag)) return out.res;
    await espera(40 + Math.random() * 120 * (i + 1));
  }
  throw new Error('conflicto de escritura');
}

/* ---------- utilidades ---------- */
const H = {
  'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
  'cross-origin-resource-policy': 'same-origin', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer',
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const error = (msg, status = 400) => json({ ok: false, error: msg }, status);
function limpia(t, max) {
  const s = String(t ?? '').normalize('NFKC'); let o = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    const raro = c < 32 || (c >= 127 && c < 160) || (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202e) || (c >= 0x2060 && c <= 0x2069) || c === 0xfeff || ch === '<' || ch === '>';
    o += raro ? ' ' : ch;
  }
  return o.replace(/\s{2,}/g, ' ').trim().slice(0, max);
}
const telCR = (t) => { const d = String(t || '').replace(/[^\d+]/g, '').replace(/^\+?506/, ''); return /^[2-8]\d{7}$/.test(d) ? d : null; };
const token = () => randomBytes(18).toString('base64url');
const id = () => randomBytes(6).toString('hex');
const nombreOk = (n) => /^[\p{L}\p{M} .'’-]{3,80}$/u.test(n);
function hoyCR() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: AJUSTES.zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const g = (k) => p.find((x) => x.type === k).value;
  return { fecha: `${g('year')}-${g('month')}-${g('day')}`, hora: `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}` };
}
const diaSemana = (f) => new Date(f + 'T12:00:00Z').getUTCDay();
const sumaDias = (f, n) => { const d = new Date(f + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function fechaValida(f) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) return 'Fecha inválida.';
  const h = hoyCR().fecha;
  if (f < h) return 'Esa fecha ya pasó.';
  if (f > sumaDias(h, AJUSTES.diasAdelante)) return 'Solo se puede reservar hasta ' + AJUSTES.diasAdelante + ' días adelante.';
  if (!CFG.dias.includes(diaSemana(f))) return 'Ese día no hay citas.';
  const c = cerradoDia(f); if (c) return 'Ese día Monzú no atiende' + (c.motivo ? ' (' + c.motivo + ')' : '') + '. Elija otra fecha.';
  return null;
}
const cerradoDia = (f) => CFG.cerrados.find((x) => !x.hora && f >= x.desde && f <= x.hasta);
const ocupada = (db, f, h, salvo) => db.citas.some((c) => c.fecha === f && c.hora === h && c.estado !== 'cancelada' && c.id !== salvo);
function horasDe(db, f) {
  const occ = db.citas.filter((c) => c.fecha === f && c.estado !== 'cancelada').map((c) => c.hora), ahora = hoyCR();
  const bloq = CFG.cerrados.filter((x) => x.hora && x.desde === f).map((x) => x.hora);
  return CFG.horas.map((h) => ({ h, libre: !occ.includes(h) && !bloq.includes(h) && !(f === ahora.fecha && h <= ahora.hora) }));
}
const horaOk = (h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(h || ''));
const fechaOk = (f) => /^\d{4}-\d{2}-\d{2}$/.test(String(f || '')) && !Number.isNaN(Date.parse(f + 'T12:00:00Z'));
// Citas fijas (ej. todos los viernes a las 10): se crean solas hasta 45 días adelante; el cron las va renovando.
function generaFijas(db) {
  const hoy = hoyCR().fecha, hasta = sumaDias(hoy, AJUSTES.diasAdelante), out = { creadas: 0, choques: [] };
  for (const fj of db.fijas || []) {
    const cl = db.clientes[fj.tel]; if (!cl) continue;
    let f = fj.desde > hoy ? fj.desde : hoy;
    while (diaSemana(f) !== fj.dia) f = sumaDias(f, 1);
    for (; f <= hasta; f = sumaDias(f, 7)) {
      if (db.citas.some((c) => c.fija === fj.id && (c.fijaFecha || c.fecha) === f)) continue;            // ya existe (o se canceló esa semana)
      if (f === hoy && fj.hora <= hoyCR().hora) continue;
      if (cerradoDia(f) || CFG.cerrados.some((x) => x.hora === fj.hora && x.desde === f)) continue;
      if (ocupada(db, f, fj.hora)) { out.choques.push({ fija: fj.id, nombre: cl.nombre, fecha: f, hora: fj.hora }); continue; }
      const cita = creaCita(db, cl, { ...fj, fecha: f }, 'fija'); cita.fija = fj.id; cita.fijaFecha = f; cita.estado = 'confirmada'; out.creadas++;
    }
  }
  return out;
}
// ubicación del mapa: solo números dentro de Costa Rica, redondeados (~1 m)
function ubicOk(u) {
  if (!u || typeof u !== 'object') return null;
  const lat = Number(u.lat), lng = Number(u.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 8 || lat > 11.3 || lng < -86 || lng > -82.5) return null;
  return { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 };
}
// arma y guarda una cita (la usan la reserva de la página y la reserva rápida de la tarjeta)
function creaCita(db, c, d, ip) {
  const q = cotiza(d.veh, d.paq, d.extras);
  const yaLleva = db.citas.some((x) => x.tel === c.tel && x.multa > 0 && (x.estado === 'pendiente' || x.estado === 'confirmada'));
  const multa = c.multa > 0 && !yaLleva ? c.multa : 0;
  const lin = multa ? [...q.lineas, ['Multa pendiente por no presentarse', multa]] : q.lineas;
  const cita = { id: id(), tel: c.tel, nombre: c.nombre, fecha: d.fecha, hora: d.hora, vehiculo: q.vehiculo, carro: d.carro || c.carro || '', lineas: lin, total: q.total + multa, multa, pago: d.pago, desde: q.desde,
    aroma: d.aroma || '', lugar: d.lugar, ubic: d.ubic || null, nota: d.nota || '', estado: 'pendiente', creada: new Date().toISOString(), origen: huella(ip) };
  db.citas.push(cita); purga(db);
  c.pref = { lugar: d.lugar, ubic: d.ubic || null, veh: q.v, pago: d.pago };   // para la próxima reserva rápida
  return cita;
}
const vistaTarjeta = (c) => ({ tel: c.tel, pref: c.pref || null, multa: c.multa || 0, recordatorios: (c.push || []).length > 0, tienePin: !!c.pinHash, nombre: c.nombre, carro: c.carro || '', sellos: c.sellos, meta: AJUSTES.meta, premio: AJUSTES.premio, premios: c.premios || 0, hist: (c.hist || []).slice(0, 12), codigo: 'MZ-' + c.token.slice(0, 4).toUpperCase() });
const huella = (ip) => createHash('sha256').update('monzu:' + ip).digest('base64url').slice(0, 16); // la IP nunca se guarda tal cual
function cuota(db, tipo, max) {
  const f = hoyCR().fecha; if (!db.cuotas || db.cuotas.fecha !== f) db.cuotas = { fecha: f };
  db.cuotas[tipo] = (db.cuotas[tipo] || 0) + 1; return db.cuotas[tipo] > max;
}
function anota(db, accion, detalle) { db.bitacora = [{ f: new Date().toISOString(), accion, detalle }, ...(db.bitacora || [])].slice(0, 400); }
function nuevoCliente(db, tel, nombre, carro) {
  const c = { tel, nombre, carro: carro || '', token: token(), sellos: 0, premios: 0, hist: [['Bienvenida a Monzú Club', hoyCR().fecha]], creado: new Date().toISOString() };
  db.clientes[tel] = c; db.tokens[c.token] = tel; return c;
}
function borraCliente(db, tel) {
  const c = db.clientes[tel]; if (!c) return false;
  delete db.tokens[c.token]; delete db.clientes[tel];
  db.citas = db.citas.filter((x) => x.tel !== tel);           // derecho de supresión (Ley 8968)
  return true;
}
function darSello(c, motivo) {
  if (c.sellos >= AJUSTES.meta) return false;
  c.sellos += 1; c.hist.unshift(['Sello · ' + motivo, hoyCR().fecha]); c.hist = c.hist.slice(0, 40);
  return true;
}
function purga(db) { db.citas = db.citas.filter((x) => x.fecha >= sumaDias(hoyCR().fecha, -AJUSTES.diasCitas)).slice(-3000); }

/* ---------- PIN de clientes (scrypt + bloqueo por teléfono) ---------- */
const pinOk = (p) => /^\d{4}$/.test(String(p ?? ''));
const hashPin = (pin, sal) => scryptSync(String(pin), sal, 32, { N: 16384 }).toString('base64');
function ponPin(c, pin) { c.pinSal = randomBytes(16).toString('base64'); c.pinHash = hashPin(pin, c.pinSal); c.fallos = 0; c.bloqueo = 0; }
function revisaPin(c, pin) {
  if (!c.pinHash) return 'sinpin';
  if ((c.bloqueo || 0) > Date.now()) return 'bloqueado';
  const a = Buffer.from(hashPin(pin, c.pinSal)), b = Buffer.from(c.pinHash);
  if (pinOk(pin) && a.length === b.length && timingSafeEqual(a, b)) { c.fallos = 0; c.bloqueo = 0; return 'ok'; }
  c.fallos = (c.fallos || 0) + 1; if (c.fallos >= 5) { c.bloqueo = Date.now() + 15 * 60e3; c.fallos = 0; }
  return 'mal';
}

/* ---------- intentos globales por IP (guardados en Blobs, valen para todas las instancias) ---------- */
async function intento(tipo, ip, max, ventanaMs, sumar = true) {
  const k = tipo + ':' + huella(ip), ahora = Date.now();
  return transaccion((s) => {
    for (const x of Object.keys(s)) if (!s[x] || s[x].hasta < ahora) delete s[x];          // limpia lo vencido
    const r = s[k] || { n: 0, hasta: ahora + ventanaMs };
    if (r.n >= max) return { res: true, cambio: false };
    if (!sumar) return { res: false, cambio: false };
    r.n += 1; s[k] = r; return { res: false, cambio: true };
  }, 'intentos');
}
async function limpiaIntento(tipo, ip) { const k = tipo + ':' + huella(ip); await transaccion((s) => (s[k] ? (delete s[k], { res: 1, cambio: true }) : { res: 0, cambio: false }), 'intentos'); }
const golpes = new Map(); // límite rápido en memoria (primera barrera, por instancia)
function limite(ip, clave, max, ventanaMs) {
  const k = clave + ':' + ip, ahora = Date.now(), l = (golpes.get(k) || []).filter((t) => ahora - t < ventanaMs);
  l.push(ahora); golpes.set(k, l); if (golpes.size > 5000) golpes.clear(); return l.length > max;
}

/* ---------- sesión del panel (firmada con HMAC, expira) ---------- */
const claveReal = () => String(ENV.PANEL_CLAVE || '').trim(); // ignora espacios o saltos de línea pegados por error
const panelListo = () => claveReal().length >= 10;
const llaveSesion = (v) => createHash('sha256').update('monzu-sesion|' + claveReal() + '|' + (ENV.SESION_SECRETO || '') + '|' + v).digest();
function firmaSesion(dias, v) {
  const datos = Buffer.from(JSON.stringify({ exp: Date.now() + dias * 864e5, v, n: randomBytes(8).toString('base64url') })).toString('base64url');
  return datos + '.' + createHmac('sha256', llaveSesion(v)).update(datos).digest('base64url');
}
function sesionValida(req, v) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''); const [d, f] = t.split('.');
  if (!d || !f || !panelListo()) return false;
  const ok = Buffer.from(createHmac('sha256', llaveSesion(v)).update(d).digest('base64url')), dada = Buffer.from(f);
  if (ok.length !== dada.length || !timingSafeEqual(ok, dada)) return false;
  try { const o = JSON.parse(Buffer.from(d, 'base64url').toString()); return o.exp > Date.now() && o.v === v; } catch { return false; }
}
function claveOk(dada) {
  const d = String(dada || '').trim();
  const a = createHash('sha256').update(d).digest(), b = createHash('sha256').update(claveReal()).digest();
  return d.length > 0 && timingSafeEqual(a, b);
}

/* ---------- recordatorios automáticos ---------- */
async function claveVapid() {
  const seg = await leerDB('seguridad'); if (seg.vapid) return seg.vapid;
  const nueva = await nuevaVapid();
  return transaccion((s) => (s.vapid ? { res: s.vapid, cambio: false } : (s.vapid = nueva, { res: nueva, cambio: true })), 'seguridad');
}
const horaBonita = (h) => { const [a, m] = h.split(':').map(Number); return (a > 12 ? a - 12 : a) + ':' + String(m).padStart(2, '0') + (a < 12 ? ' a. m.' : ' p. m.'); };
// WhatsApp automático (API oficial de Meta). Solo funciona si el dueño configuró WA_TOKEN y WA_NUMERO_ID en Cloudflare.
// Usa la plantilla aprobada "recordatorio_cita" (o WA_PLANTILLA) con 5 datos: nombre, cuándo, hora, lugar y enlace de la tarjeta.
const waActivo = () => !!(ENV.WA_TOKEN && /^\d{6,20}$/.test(String(ENV.WA_NUMERO_ID || '')));
const waTexto = (t, n) => String(t || '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, n) || '-';
async function enviarWA(tel, datos, fetchFn, plantilla) {
  const r = await (fetchFn || fetch)('https://graph.facebook.com/' + (ENV.WA_VERSION || 'v23.0') + '/' + ENV.WA_NUMERO_ID + '/messages', {
    method: 'POST', headers: { authorization: 'Bearer ' + ENV.WA_TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: '506' + tel, type: 'template', template: { name: plantilla || ENV.WA_PLANTILLA || 'recordatorio_cita', language: { code: ENV.WA_IDIOMA || 'es' },
      components: [{ type: 'body', parameters: datos.map((x) => ({ type: 'text', text: x })) }] } }),
  });
  if (!r.ok) console.error('whatsapp', r.status, (await r.text().catch(() => '')).slice(0, 300));
  return r.ok;
}
// Al terminar el lavado: pide la reseña de Google por WhatsApp (si está activo) y por notificación al celular.
async function pideResena(c, fetchFn) {
  let via = null;
  if (waActivo()) {
    try { if (await enviarWA(c.tel, [waTexto(c.nombre.split(' ')[0], 40), CFG.resena], fetchFn, ENV.WA_PLANTILLA_RESENA || 'pedir_resena')) via = 'whatsapp'; } catch (e) { console.error('resena', e && e.message); }
  }
  if (c.subs.length) {
    try {
      const vapid = await claveVapid();
      for (const s of c.subs) { const st = await enviarPush(s, { title: '¡Gracias por lavar con Monzú! ⭐', body: '¿Cómo le quedó su carro? Toque aquí y califíquenos en Google: nos ayuda muchísimo.' }, vapid, ENV.SITIO_URL || 'https://monzu.example', fetchFn); if (st >= 200 && st < 300) via = via ? via + '+push' : 'push'; }
    } catch (e) { console.error('resena push', e && e.message); }
  }
  return via;
}
// Se llama cada 10 minutos (cron del Worker). Manda el recordatorio de 24 h y el de 1 h una sola vez por cita.
// Cron: primero renueva las citas fijas, luego manda los recordatorios.
export async function tareas(opts) {
  A = opts.almacen; ENV = opts.env || {}; await cargaConfig();
  const g = await transaccion((db) => { const o = generaFijas(db); return { res: o, cambio: o.creadas > 0 }; });
  const rec = await recordar(opts);
  return { fijas: g, ...rec };
}
export async function recordar(opts) {
  A = opts.almacen; ENV = opts.env || {}; await cargaConfig();
  const ahora = opts.ahora || Date.now(), db = await leerDB(), envios = [];
  for (const c of db.citas) {
    if (c.estado !== 'pendiente' && c.estado !== 'confirmada') continue;
    const falta = inicioCita(c) - ahora; if (falta <= 0) continue;
    let tipo = null;
    if (falta <= 70 * 60e3 && !c.r1) tipo = 'r1';
    else if (falta <= 24 * 36e5 && falta > 70 * 60e3 && !c.r24) tipo = 'r24';
    if (!tipo) continue;
    const cl = db.clientes[c.tel];
    const hoy = new Date(ahora - 6 * 36e5).toISOString().slice(0, 10) === c.fecha;
    const wa = cl ? [waTexto(cl.nombre.split(' ')[0], 40), tipo === 'r1' ? 'hoy (en 1 hora)' : hoy ? 'hoy' : 'mañana', horaBonita(c.hora), waTexto(c.lugar, 120), (ENV.SITIO_URL || '') + '/tarjeta.html?t=' + cl.token] : null;
    envios.push({ id: c.id, tipo, tel: c.tel, wa, subs: (cl && cl.push) || [], cuerpo: tipo === 'r24'
      ? 'Le recordamos su cita de ' + (new Date(ahora - 6 * 36e5).toISOString().slice(0, 10) === c.fecha ? 'hoy' : 'mañana') + ' a las ' + horaBonita(c.hora) + ' en ' + c.lugar + '. Si no puede, cancele desde su tarjeta antes de ' + AJUSTES.horasCancelar + ' horas para evitar la multa de ₡' + AJUSTES.multa.toLocaleString('es-CR') + '.'
      : 'Su cita con Monzú es a las ' + horaBonita(c.hora) + ' (en 1 hora) en ' + c.lugar + '. ¡Ya vamos!' });
  }
  if (!envios.length) return { enviados: 0, citas: 0 };
  const vapid = await claveVapid(), contacto = ENV.SITIO_URL || 'https://monzu.example', muertos = [];
  let enviados = 0;
  for (const e of envios) {
    e.ok = false; e.wa_ok = false;
    if (waActivo() && e.wa) { try { e.wa_ok = await enviarWA(e.tel, e.wa, opts.fetch); if (e.wa_ok) enviados++; } catch (err) { console.error('whatsapp', err && err.message); } }
    for (const s of e.subs) {
      try {
        const st = await enviarPush(s, { title: 'Monzú Detallados', body: e.cuerpo, url: '/tarjeta' }, vapid, contacto, opts.fetch);
        if (st >= 200 && st < 300) { e.ok = true; enviados++; } else if (st === 404 || st === 410) muertos.push(s.endpoint);
      } catch (err) { console.error('push', err && err.message); }
    }
  }
  await transaccion((d) => {
    for (const e of envios) {
      const c = d.citas.find((x) => x.id === e.id); if (!c) continue;
      c[e.tipo] = e.wa_ok ? (e.ok ? 'whatsapp+push' : 'whatsapp') : e.ok ? 'push' : 'sin-notificaciones'; if (e.tipo === 'r1' && !c.r24) c.r24 = 'tarde';
    }
    if (muertos.length) for (const cl of Object.values(d.clientes)) if (cl.push) cl.push = cl.push.filter((s) => !muertos.includes(s.endpoint));
    return { res: 1, cambio: true };
  });
  return { enviados, citas: envios.length };
}

/* ---------- rutas ---------- */
export async function manejar(req, opts) {
  A = opts.almacen; ENV = opts.env || {}; await cargaConfig();
  const url = new URL(req.url);
  const ruta = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const ip = opts.ip || 'local';
  if (req.method !== 'GET' && req.method !== 'POST') return error('Método no permitido.', 405);
  let body = {};
  if (req.method === 'POST') {
    const origen = req.headers.get('origin');                                 // anti CSRF: solo desde la propia página
    if (origen && new URL(origen).host !== url.host) return error('Origen no permitido.', 403);
    if (!(req.headers.get('content-type') || '').includes('application/json')) return error('Formato no válido.', 415);
    const txt = await req.text(); if (txt.length > (ruta === 'panel/importar' ? 60000 : ruta === 'panel/servicios' ? 30000 : 8000)) return error('Solicitud demasiado grande.', 413);
    try { body = JSON.parse(txt || '{}'); } catch { return error('JSON inválido.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return error('Solicitud inválida.');
  }
  try {
    /* ===== público ===== */
    if (ruta === 'horarios' && req.method === 'GET') {
      if (limite(ip, 'hor', 120, 60e3)) return error('Demasiadas consultas. Espere un minuto.', 429);
      const f = url.searchParams.get('fecha'); const m = fechaValida(f);
      if (m) return json({ ok: true, fecha: f, cerrado: true, motivo: m, horas: [] });
      const db = await leerDB(); return json({ ok: true, fecha: f, cerrado: false, horas: horasDe(db, f) });
    }

    if (ruta === 'reservar' && req.method === 'POST') {
      if (body.web) return json({ ok: true });                                   // trampa anti robots
      if (limite(ip, 'res', 6, 3600e3)) return error('Demasiadas reservas desde esta conexión. Escríbanos por WhatsApp.', 429);
      const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), lugar = limpia(body.lugar, 120), carro = limpia(body.carro, 60), nota = limpia(body.nota, 400);
      const fecha = String(body.fecha || ''), hora = String(body.hora || '');
      if (!nombreOk(nombre)) return error('Revise su nombre.');
      if (!tel) return error('Revise el teléfono (8 dígitos).');
      if (body.pin && !pinOk(body.pin)) return error('El PIN debe tener 4 números.');
      if (lugar.length < 4) return error('Falta la dirección o zona.');
      const m = fechaValida(fecha); if (m) return error(m);
      if (!CFG.horas.includes(hora)) return error('Elija una hora de la lista.');
      if (body.consentimiento !== true) return error('Debe aceptar los términos y autorizar el uso de sus datos.');
      const pago = AJUSTES.pagos.includes(body.pago) ? body.pago : null;
      if (!pago) return error('Elija cómo va a pagar: efectivo, SINPE Móvil o transferencia.');
      const q = cotiza(body.veh, body.paq, body.extras);
      if (!q.lineas.length) return error('Elija un paquete o un adicional.');
      return await transaccion((db) => {
        if (!horasDe(db, fecha).find((x) => x.h === hora && x.libre)) return { res: error('Esa hora se acaba de ocupar. Elija otra, por favor.', 409), cambio: false };
        if (db.citas.filter((c) => c.tel === tel && c.estado !== 'cancelada' && c.estado !== 'hecha').length >= 3) return { res: error('Ya tiene 3 citas pendientes. Escríbanos por WhatsApp para cambiarlas.'), cambio: false };
        if (cuota(db, 'res', AJUSTES.maxReservasDia)) return { res: error('Hoy ya no se reciben más reservas en línea. Escríbanos por WhatsApp.', 429), cambio: false };
        let c = db.clientes[tel], nueva = false, tk = null, aviso = '';
        if (!c) { if (cuota(db, 'reg', AJUSTES.maxRegistrosDia)) return { res: error('Hoy ya no se reciben más registros. Escríbanos por WhatsApp.', 429), cambio: false }; c = nuevoCliente(db, tel, nombre, carro); nueva = true; if (pinOk(body.pin)) ponPin(c, body.pin); tk = c.token; }
        else {
          if (carro && !c.carro) c.carro = carro;
          if (!c.pinHash) aviso = 'sinpin';
          else if (!body.pin) aviso = 'conpin';
          else { const r = revisaPin(c, String(body.pin)); if (r === 'ok') tk = c.token; else aviso = r === 'bloqueado' ? 'bloqueado' : 'pinmal'; }
        }
        const cita = creaCita(db, c, { fecha, hora, veh: body.veh, paq: body.paq, extras: body.extras, pago, aroma: limpia(body.aroma, 30), lugar, ubic: ubicOk(body.ubic), nota, carro }, ip);
        if (cita.nombre !== nombre) cita.nombreDado = nombre;
        return { res: json({ ok: true, cita: { id: cita.id, fecha, hora, total: tk ? cita.total : null, multa: tk ? cita.multa : null, pago }, tarjeta: tk, nueva, aviso, tienePin: !!c.pinHash }), cambio: true };
      });
    }

    if (ruta === 'registro' && req.method === 'POST') {
      if (body.web) return json({ ok: true });
      if (limite(ip, 'reg', 8, 3600e3)) return error('Demasiados registros desde esta conexión. Intente más tarde.', 429);
      const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), carro = limpia(body.carro, 60);
      if (!nombreOk(nombre)) return error('Revise su nombre.');
      if (!tel) return error('Revise el teléfono (8 dígitos).');
      if (!pinOk(body.pin)) return error('El PIN debe tener 4 números.');
      if (body.consentimiento !== true) return error('Debe aceptar los términos y autorizar el uso de sus datos.');
      return await transaccion((db) => {
        const ya = db.clientes[tel];
        if (ya) return { res: error(ya.pinHash ? 'Ese teléfono ya está en Monzú Club. Entre con su teléfono y su PIN.' : 'Ese teléfono ya tiene tarjeta. Ábrala con el enlace que le enviamos por WhatsApp para crear su PIN, o pídanos el enlace.', 409), cambio: false };
        if (cuota(db, 'reg', AJUSTES.maxRegistrosDia)) return { res: error('Hoy ya no se reciben más registros. Intente mañana.', 429), cambio: false };
        const c = nuevoCliente(db, tel, nombre, carro); ponPin(c, body.pin);
        return { res: json({ ok: true, tarjeta: c.token }), cambio: true };
      });
    }

    if (ruta === 'entrar' && req.method === 'POST') {
      if (limite(ip, 'ent', 20, 900e3) || await intento('ent', ip, 25, 900e3, false)) return error('Demasiados intentos. Espere 15 minutos.', 429);
      const tel = telCR(body.tel); if (!tel || !pinOk(body.pin)) return error('Escriba su teléfono (8 dígitos) y su PIN (4 números).');
      const r = await transaccion((db) => {
        const c = db.clientes[tel]; if (!c) return { res: { e: 'mal' }, cambio: false };
        const x = revisaPin(c, String(body.pin));
        return { res: { e: x, t: c.token }, cambio: x !== 'sinpin' && x !== 'bloqueado' };
      });
      if (r.e === 'ok') return json({ ok: true, tarjeta: r.t });
      await intento('ent', ip, 25, 900e3);
      if (r.e === 'sinpin') return error('Su tarjeta todavía no tiene PIN. Ábrala con el enlace que le enviamos por WhatsApp para crearlo, o pídanos el enlace.', 403);
      if (r.e === 'bloqueado') return error('Demasiados intentos con ese teléfono. Espere 15 minutos o pida a Monzú que le restablezca el PIN.', 429);
      return error('Teléfono o PIN incorrectos.', 401);
    }

    if (ruta === 'pin' && req.method === 'POST') {
      const t = String(body.t || ''); if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      if (!pinOk(body.pin)) return error('El PIN debe tener 4 números.');
      return await transaccion((db) => {
        const tel = db.tokens[t], c = tel && db.clientes[tel];
        if (!c) return { res: error('Tarjeta no encontrada.', 404), cambio: false };
        if (c.pinHash) return { res: error('Esta tarjeta ya tiene PIN. Si lo olvidó, pídale a Monzú que se lo restablezca.', 409), cambio: false };
        ponPin(c, body.pin); return { res: json({ ok: true }), cambio: true };
      });
    }

    if (ruta === 'borrar-tarjeta' && req.method === 'POST') {                      // el cliente borra sus datos
      if (limite(ip, 'bor', 10, 900e3)) return error('Demasiados intentos. Espere 15 minutos.', 429);
      const t = String(body.t || ''); if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      return await transaccion((db) => {
        const tel = db.tokens[t], c = tel && db.clientes[tel];
        if (!c) return { res: error('Tarjeta no encontrada.', 404), cambio: false };
        if (c.pinHash) { const r = revisaPin(c, String(body.pin || '')); if (r !== 'ok') return { res: error(r === 'bloqueado' ? 'Demasiados intentos. Espere 15 minutos.' : 'PIN incorrecto.', r === 'bloqueado' ? 429 : 401), cambio: true }; }
        borraCliente(db, tel); anota(db, 'cliente borró sus datos', 'tel ***' + tel.slice(-2));
        return { res: json({ ok: true }), cambio: true };
      });
    }

    if (ruta === 'cancelar' && req.method === 'POST') {                          // el cliente cancela su cita
      if (limite(ip, 'can', 10, 900e3)) return error('Demasiados intentos. Espere unos minutos.', 429);
      const t = String(body.t || ''); if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      return await transaccion((db) => {
        const tel = db.tokens[t], c = db.citas.find((x) => x.id === body.id && x.tel === tel);
        if (!tel || !c) return { res: error('Cita no encontrada.', 404), cambio: false };
        if (c.estado !== 'pendiente' && c.estado !== 'confirmada') return { res: error('Esa cita ya no se puede cancelar.'), cambio: false };
        if (inicioCita(c) - Date.now() < AJUSTES.horasCancelar * 36e5) return { res: error('Faltan menos de ' + AJUSTES.horasCancelar + ' horas para su cita: escríbanos por WhatsApp.', 409), cambio: false };
        c.estado = 'cancelada'; c.canceladaPor = 'cliente'; anota(db, 'cliente canceló su cita', c.nombre + ' ' + c.fecha + ' ' + c.hora);
        return { res: json({ ok: true }), cambio: true };
      });
    }
    if (ruta === 'catalogo' && req.method === 'GET') {                            // servicios y precios para la reserva rápida
      return json({ ok: true, ...catPublico(), pagos: AJUSTES.pagos, horas: CFG.horas, dias: CFG.dias, cerrados: CFG.cerrados.filter((x) => !x.hora && x.hasta >= hoyCR().fecha).map(({ desde, hasta }) => ({ desde, hasta })), diasAdelante: AJUSTES.diasAdelante, multa: AJUSTES.multa, horasCancelar: AJUSTES.horasCancelar });
    }
    if (ruta === 'reservar-rapido' && req.method === 'POST') {                    // reserva desde la tarjeta: ya conocemos al cliente
      if (limite(ip, 'res', 6, 3600e3)) return error('Demasiadas reservas desde esta conexión. Escríbanos por WhatsApp.', 429);
      const t = String(body.t || ''); if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      const fecha = String(body.fecha || ''), hora = String(body.hora || ''), lugar = limpia(body.lugar, 120), nota = limpia(body.nota, 400);
      const m = fechaValida(fecha); if (m) return error(m);
      if (!CFG.horas.includes(hora)) return error('Elija una hora de la lista.');
      if (lugar.length < 4) return error('Falta la dirección o zona.');
      const pago = AJUSTES.pagos.includes(body.pago) ? body.pago : null; if (!pago) return error('Elija cómo va a pagar.');
      if (!cotiza(body.veh, body.paq, body.extras).lineas.length) return error('Elija un paquete o un adicional.');
      return await transaccion((db) => {
        const tel = db.tokens[t], c = tel && db.clientes[tel]; if (!c) return { res: error('Tarjeta no encontrada.', 404), cambio: false };
        if (!horasDe(db, fecha).find((x) => x.h === hora && x.libre)) return { res: error('Esa hora se acaba de ocupar. Elija otra, por favor.', 409), cambio: false };
        if (db.citas.filter((x) => x.tel === tel && (x.estado === 'pendiente' || x.estado === 'confirmada')).length >= 3) return { res: error('Ya tiene 3 citas pendientes. Escríbanos por WhatsApp para cambiarlas.'), cambio: false };
        if (cuota(db, 'res', AJUSTES.maxReservasDia)) return { res: error('Hoy ya no se reciben más reservas en línea. Escríbanos por WhatsApp.', 429), cambio: false };
        const cita = creaCita(db, c, { fecha, hora, veh: body.veh, paq: body.paq, extras: body.extras, pago, lugar, ubic: ubicOk(body.ubic), nota }, ip);
        return { res: json({ ok: true, cita: { id: cita.id, fecha, hora, total: cita.total, multa: cita.multa, pago } }), cambio: true };
      });
    }
    if (ruta === 'cambiar' && req.method === 'POST') {                            // el cliente cambia la fecha u hora de su cita
      if (limite(ip, 'cam', 10, 900e3)) return error('Demasiados intentos. Espere unos minutos.', 429);
      const t = String(body.t || ''); if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      const fecha = String(body.fecha || ''), hora = String(body.hora || '');
      const m = fechaValida(fecha); if (m) return error(m);
      if (!CFG.horas.includes(hora)) return error('Elija una hora de la lista.');
      return await transaccion((db) => {
        const tel = db.tokens[t], c = db.citas.find((x) => x.id === body.id && x.tel === tel);
        if (!tel || !c) return { res: error('Cita no encontrada.', 404), cambio: false };
        if (c.estado !== 'pendiente' && c.estado !== 'confirmada') return { res: error('Esa cita ya no se puede cambiar.'), cambio: false };
        if (inicioCita(c) - Date.now() < AJUSTES.horasCancelar * 36e5) return { res: error('Faltan menos de ' + AJUSTES.horasCancelar + ' horas para su cita: escríbanos por WhatsApp.', 409), cambio: false };
        if ((c.cambios || 0) >= 3) return { res: error('Esta cita ya se cambió 3 veces. Escríbanos por WhatsApp.'), cambio: false };
        if (c.fecha === fecha && c.hora === hora) return { res: json({ ok: true }), cambio: false };
        if (!horasDe(db, fecha).find((x) => x.h === hora && x.libre)) return { res: error('Esa hora ya está ocupada. Elija otra.', 409), cambio: false };
        const antes = c.fecha + ' ' + c.hora;
        c.fecha = fecha; c.hora = hora; c.estado = 'pendiente'; c.cambios = (c.cambios || 0) + 1; c.cambiada = antes; delete c.r24; delete c.r1;
        anota(db, 'cliente cambió su cita', c.nombre + ' ' + antes + ' → ' + fecha + ' ' + hora);
        return { res: json({ ok: true }), cambio: true };
      });
    }
    if (ruta === 'push/clave' && req.method === 'GET') {                         // llave pública para activar notificaciones
      const v = await claveVapid(); return json({ ok: true, clave: v.pub });
    }
    if (ruta === 'push' && req.method === 'POST') {                              // guardar la suscripción del celular del cliente
      if (limite(ip, 'push', 20, 900e3)) return error('Demasiados intentos. Espere unos minutos.', 429);
      const t = String(body.t || ''), sub = body.sub || {};
      if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      const quitar = body.quitar === true;
      if (!quitar && (!endpointValido(sub.endpoint) || !sub.keys || !/^[\w-]{80,100}$/.test(sub.keys.p256dh || '') || !/^[\w-]{20,30}$/.test(sub.keys.auth || ''))) return error('Suscripción no válida.');
      return await transaccion((db) => {
        const tel = db.tokens[t], c = tel && db.clientes[tel]; if (!c) return { res: error('Tarjeta no encontrada.', 404), cambio: false };
        c.push = (c.push || []).filter((x) => x.endpoint !== sub.endpoint);
        if (!quitar) c.push = [{ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, desde: new Date().toISOString() }, ...c.push].slice(0, 3);
        return { res: json({ ok: true, activos: c.push.length }), cambio: true };
      });
    }
    if (ruta === 'tarjeta' && req.method === 'GET') {
      if (limite(ip, 'tj', 60, 60e3)) return error('Demasiadas consultas. Espere un minuto.', 429);
      const t = url.searchParams.get('t') || ''; if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      const db = await leerDB(); const tel = db.tokens[t]; const c = tel && db.clientes[tel];
      if (!c) return error('Tarjeta no encontrada.', 404);
      const prox = db.citas.filter((x) => x.tel === tel && (x.estado === 'pendiente' || x.estado === 'confirmada') && x.fecha >= hoyCR().fecha).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
      const reciente = db.citas.some((x) => x.tel === tel && x.estado === 'hecha' && x.fecha >= sumaDias(hoyCR().fecha, -5));
      return json({ ok: true, tarjeta: vistaTarjeta(c), resena: reciente ? CFG.resena : null, horasCancelar: AJUSTES.horasCancelar, multaMonto: AJUSTES.multa, proxima: prox ? { id: prox.id, fecha: prox.fecha, hora: prox.hora, estado: prox.estado, lugar: prox.lugar, total: prox.total, pago: prox.pago, multa: prox.multa || 0, cancelable: inicioCita(prox) - Date.now() >= AJUSTES.horasCancelar * 36e5 } : null });
    }

    /* ===== panel del dueño ===== */
    if (ruta.startsWith('panel/')) {
      if (!panelListo()) return error('El panel todavía no está activado: falta configurar PANEL_CLAVE (mínimo 10 caracteres) en Netlify.', 503);
      if (limite(ip, 'panel', 120, 60e3)) return error('Demasiadas solicitudes. Espere un minuto.', 429);
      const accion = ruta.slice(6);
      const seg = await leerDB('seguridad'); const ver = seg.version || 1;

      if (accion === 'login' && req.method === 'POST') {
        if (await intento('panel', ip, 8, 900e3, false)) return error('Demasiados intentos. Espere 15 minutos.', 429);
        if (!claveOk(body.clave)) { await intento('panel', ip, 8, 900e3); return error('Contraseña incorrecta.', 401); }
        await limpiaIntento('panel', ip);
        await transaccion((db) => { anota(db, 'entrada al panel', 'equipo ' + huella(ip).slice(0, 6)); return { res: 1, cambio: true }; });
        return json({ ok: true, sesion: firmaSesion(body.recordar ? 30 : 0.5, ver) });
      }
      if (!sesionValida(req, ver)) return error('Su sesión venció. Entre otra vez.', 401);

      if (accion === 'cerrar-todo' && req.method === 'POST') {
        await transaccion((s) => { s.version = (s.version || 1) + 1; return { res: 1, cambio: true }; }, 'seguridad');
        return json({ ok: true });
      }
      if (accion === 'resumen' && req.method === 'GET') {
        const db = await leerDB(), desde = sumaDias(hoyCR().fecha, -7);
        const citas = db.citas.filter((c) => c.fecha >= desde).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
          .map(({ origen, ...c }) => ({ ...c, sellos: db.clientes[c.tel]?.sellos ?? 0, tarjeta: db.clientes[c.tel]?.token, multaCliente: db.clientes[c.tel]?.multa || 0, conNotificaciones: (db.clientes[c.tel]?.push || []).length > 0, inicio: inicioCita(c) }));
        const clientes = Object.values(db.clientes).map((c) => ({ nombre: c.nombre, tel: c.tel, carro: c.carro || '', sellos: c.sellos, premios: c.premios || 0, tarjeta: c.token, tienePin: !!c.pinHash, creado: c.creado || '', multa: c.multa || 0, conNotificaciones: (c.push || []).length > 0 }))
          .sort((a, b) => b.sellos - a.sellos || a.nombre.localeCompare(b.nombre));
        const fijas = (db.fijas || []).map((f) => ({ ...f, nombre: db.clientes[f.tel]?.nombre || '(cliente borrado)' }));
        return json({ ok: true, config: { horas: CFG.horas, dias: CFG.dias, cerrados: CFG.cerrados, cat: CFG.cat, resena: CFG.resena, metaMes: CFG.metaMes || 0 }, fijas, pagos: AJUSTES.pagos, hoy: hoyCR().fecha, ahora: Date.now(), waAuto: waActivo(), meta: AJUSTES.meta, premio: AJUSTES.premio, multaMonto: AJUSTES.multa, horasCancelar: AJUSTES.horasCancelar, citas, clientes });
      }
      if (accion === 'respaldo' && req.method === 'GET') {                       // copia de seguridad para el dueño (sin PIN)
        const db = await leerDB();
        const clientes = Object.values(db.clientes).map(({ pinHash, pinSal, fallos, bloqueo, token: tk, push, ...c }) => ({ ...c, tienePin: !!pinHash, notificaciones: (push || []).length > 0 }));
        const citas = db.citas.map(({ origen, ...c }) => c);
        return new Response(JSON.stringify({ generado: new Date().toISOString(), negocio: 'Monzú Detallados', clientes, citas, bitacora: db.bitacora || [] }, null, 1),
          { status: 200, headers: { ...H, 'content-disposition': 'attachment; filename="monzu-respaldo-' + hoyCR().fecha + '.json"' } });
      }
      if (accion === 'reporte' && req.method === 'GET') {                        // ganancias por día, semana y mes
        const db = await leerDB(), hoy = hoyCR().fecha, lunes = sumaDias(hoy, -((diaSemana(hoy) + 6) % 7)), mes = hoy.slice(0, 8) + '01';
        const mesAnt = sumaDias(mes, -1).slice(0, 8) + '01';
        const suma = (desde, hasta) => {
          const l = db.citas.filter((c) => c.estado === 'hecha' && c.fecha >= desde && c.fecha <= hasta), porPago = {};
          AJUSTES.pagos.forEach((p) => { porPago[p] = 0; });
          l.forEach((c) => { porPago[c.pago || 'Sin indicar'] = (porPago[c.pago || 'Sin indicar'] || 0) + c.total; });
          return { total: l.reduce((a, c) => a + c.total, 0), citas: l.length, porPago, pagado: l.filter((c) => c.pagado).reduce((a, c) => a + c.total, 0),
            multas: l.reduce((a, c) => a + (c.multa || 0), 0), ausentes: db.citas.filter((c) => c.estado === 'ausente' && c.fecha >= desde && c.fecha <= hasta).length };
        };
        const dias = []; for (let i = 34; i >= 0; i--) { const f = sumaDias(hoy, -i); dias.push({ fecha: f, ...suma(f, f) }); }
        return json({ ok: true, hoy, periodos: { hoy: suma(hoy, hoy), semana: suma(lunes, hoy), mes: suma(mes, hoy), mesAnterior: suma(mesAnt, sumaDias(mes, -1)) }, dias, meses: db.meses || {}, porCobrar: db.citas.filter((c) => c.estado === 'hecha' && !c.pagado).map((c) => ({ id: c.id, nombre: c.nombre, fecha: c.fecha, total: c.total, pago: c.pago })) });
      }
      if (req.method !== 'POST') return error('Ruta no encontrada.', 404);

      if (accion === 'horario') {                                                 // horas de atención y días de trabajo
        const horas = [...new Set((Array.isArray(body.horas) ? body.horas : []).map(String))].filter(horaOk).sort();
        const dias = [...new Set((Array.isArray(body.dias) ? body.dias : []).map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
        if (!horas.length || horas.length > 16) return error('Ponga entre 1 y 16 horas de cita.');
        if (!dias.length) return error('Elija al menos un día de trabajo.');
        await transaccion((c) => { c.horas = horas; c.dias = dias; return { res: 1, cambio: true }; }, 'config');
        return json({ ok: true, horas, dias });
      }
      if (accion === 'cerrar') {                                                  // cerrar días (vacaciones) o bloquear una hora
        const desde = String(body.desde || ''), hasta = String(body.hasta || desde), hora = body.hora ? String(body.hora) : '', motivo = limpia(body.motivo, 60);
        if (!fechaOk(desde) || !fechaOk(hasta) || hasta < desde) return error('Revise las fechas.');
        if (sumaDias(desde, 366) < hasta) return error('Máximo un año.');
        if (hora && (!horaOk(hora) || hasta !== desde)) return error('Para bloquear una hora elija un solo día.');
        const nuevo = { id: id(), desde, hasta, motivo, ...(hora ? { hora } : {}) };
        await transaccion((c) => { c.cerrados = [...(c.cerrados || configBase().cerrados).filter((x) => x.hasta >= hoyCR().fecha), nuevo].slice(-100); return { res: 1, cambio: true }; }, 'config');
        const db = await leerDB();
        const afectadas = db.citas.filter((c) => (c.estado === 'pendiente' || c.estado === 'confirmada') && c.fecha >= desde && c.fecha <= hasta && (!hora || c.hora === hora))
          .map((c) => ({ id: c.id, nombre: c.nombre, tel: c.tel, fecha: c.fecha, hora: c.hora, tarjeta: db.clientes[c.tel]?.token }));
        return json({ ok: true, cerrado: nuevo, afectadas });
      }
      if (accion === 'abrir') {
        await transaccion((c) => { c.cerrados = (c.cerrados || []).filter((x) => x.id !== body.id); return { res: 1, cambio: true }; }, 'config');
        return json({ ok: true });
      }
      if (accion === 'meta') {                                                    // meta de ganancias del mes
        const m = Math.round(Number(body.monto)); if (!Number.isFinite(m) || m < 0 || m > 1e9) return error('Revise el monto.');
        await transaccion((c) => { c.metaMes = m; return { res: 1, cambio: true }; }, 'config');
        return json({ ok: true });
      }
      if (accion === 'resena') {
        const u = String(body.url || '').trim(); let ok = false;
        try { const x = new URL(u); ok = x.protocol === 'https:' && /(^|\.)(google\.[a-z.]+|g\.page|goo\.gl|g\.co)$/.test(x.hostname); } catch {}
        if (!ok || u.length > 300) return error('Pegue el enlace de reseñas de Google (empieza con https://g.page/… o https://maps.app.goo.gl/…).');
        await transaccion((c) => { c.resena = u; return { res: 1, cambio: true }; }, 'config');
        return json({ ok: true });
      }
      if (accion === 'servicios') {                                               // precios y servicios
        const ent = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= max ? n : null; };
        const cat = body.cat || {}, nuevo = { paq: {}, ext: {} };
        for (const k of ['premium', 'deluxe']) {
          const P = (cat.paq || {})[k] || {}, n = limpia(P.n, 40), se = ent(P.sedan, 1e6), su = ent(P.suv, 1e6);
          if (n.length < 3 || se === null || su === null) return error('Revise el nombre y los precios del paquete ' + k + '.');
          nuevo.paq[k] = { n, sedan: se, suv: su, incluye: (Array.isArray(P.incluye) ? P.incluye : []).map((x) => limpia(x, 160)).filter(Boolean).slice(0, 12) };
        }
        const ext = Object.entries(cat.ext || {}).slice(0, 20);
        for (const [k, x] of ext) {
          if (!/^[a-z0-9]{2,20}$/.test(k)) return error('Servicio adicional inválido.');
          const n = limpia(x && x.n, 40), pr = ent(x && x.p, 1e6), cp = x && x.conPaq !== '' && x.conPaq != null ? ent(x.conPaq, 1e6) : null;
          if (n.length < 3 || pr === null) return error('Revise el nombre y el precio de "' + (n || k) + '".');
          nuevo.ext[k] = { n, p: pr, ...(cp !== null && cp !== pr ? { conPaq: cp } : {}), ...(x.desde ? { desde: true } : {}), ...(x.oculto ? { oculto: true } : {}) };
        }
        await transaccion((c) => { c.cat = nuevo; return { res: 1, cambio: true }; }, 'config');
        await transaccion((db) => { anota(db, 'precios actualizados', ''); return { res: 1, cambio: true }; });
        return json({ ok: true, cat: nuevo });
      }
      if (accion === 'agendar') {                                                 // el dueño aparta una cita (y opcionalmente la deja fija cada semana)
        const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), fecha = String(body.fecha || ''), hora = String(body.hora || ''), lugar = limpia(body.lugar, 120);
        if (!tel) return error('Revise el teléfono (8 dígitos).');
        if (!fechaOk(fecha) || fecha < hoyCR().fecha) return error('Revise la fecha.');
        if (!horaOk(hora)) return error('Revise la hora.');
        const pago = AJUSTES.pagos.includes(body.pago) ? body.pago : AJUSTES.pagos[0];
        if (!cotiza(body.veh, body.paq, body.extras).lineas.length) return error('Elija un paquete o un adicional.');
        const repetir = body.repetir === true;
        const out = await transaccion((db) => {
          let c = db.clientes[tel], nuevo = false;
          if (!c) { if (!nombreOk(nombre)) return { res: error('Escriba el nombre del cliente.'), cambio: false }; c = nuevoCliente(db, tel, nombre, limpia(body.carro, 60)); nuevo = true; }
          const sitio = lugar || (c.pref && c.pref.lugar) || '';
          if (sitio.length < 3) return { res: error('Escriba la dirección o zona.'), cambio: false };
          if (ocupada(db, fecha, hora)) return { res: error('Esa hora ya tiene una cita ese día.', 409), cambio: false };
          const datos = { fecha, hora, veh: body.veh, paq: body.paq, extras: body.extras, pago, lugar: sitio, ubic: (lugar ? null : c.pref && c.pref.ubic) || null, nota: limpia(body.nota, 400), carro: limpia(body.carro, 60) };
          const cita = creaCita(db, c, datos, 'panel'); cita.estado = 'confirmada'; cita.porDueno = true;
          let gen = null;
          if (repetir) {
            const fj = { id: id(), tel, dia: diaSemana(fecha), hora, veh: body.veh === 'suv' ? 'suv' : 'sedan', paq: String(body.paq || ''), extras: Array.isArray(body.extras) ? body.extras.map(String).slice(0, 8) : [], pago, lugar: sitio, ubic: datos.ubic, nota: datos.nota, desde: fecha, creada: new Date().toISOString() };
            db.fijas = [...(db.fijas || []), fj].slice(-200); cita.fija = fj.id; cita.fijaFecha = fecha; gen = generaFijas(db);
          }
          anota(db, repetir ? 'cita fija creada' : 'cita agendada por el dueño', c.nombre + ' ' + fecha + ' ' + hora);
          return { res: { cita, nuevo, nombre: c.nombre, tarjeta: c.token, gen }, cambio: true };
        });
        if (out instanceof Response) return out;
        return json({ ok: true, id: out.cita.id, nombre: out.nombre, tel, tarjeta: out.tarjeta, nuevo: out.nuevo, total: out.cita.total, fijas: out.gen ? out.gen.creadas + 1 : 0, choques: out.gen ? out.gen.choques : [] });
      }
      if (accion === 'quitar-fija') {
        return await transaccion((db) => {
          const fj = (db.fijas || []).find((x) => x.id === body.id); if (!fj) return { res: error('No encontrada.', 404), cambio: false };
          db.fijas = db.fijas.filter((x) => x.id !== fj.id); let n = 0;
          if (body.borrarCitas !== false) db.citas.forEach((c) => { if (c.fija === fj.id && (c.estado === 'pendiente' || c.estado === 'confirmada') && inicioCita(c) > Date.now()) { c.estado = 'cancelada'; c.canceladaPor = 'dueño'; n++; } });
          anota(db, 'cita fija quitada', (db.clientes[fj.tel]?.nombre || '') + ' · ' + n + ' citas canceladas');
          return { res: json({ ok: true, canceladas: n }), cambio: true };
        });
      }
      if (accion === 'mover') {                                                   // el dueño cambia la fecha u hora de una cita
        const fecha = String(body.fecha || ''), hora = String(body.hora || '');
        if (!fechaOk(fecha) || fecha < hoyCR().fecha || !horaOk(hora)) return error('Revise la fecha y la hora.');
        return await transaccion((db) => {
          const c = db.citas.find((x) => x.id === body.id); if (!c) return { res: error('Cita no encontrada.', 404), cambio: false };
          if (c.estado !== 'pendiente' && c.estado !== 'confirmada') return { res: error('Esa cita ya no se puede mover.'), cambio: false };
          if (ocupada(db, fecha, hora, c.id)) return { res: error('Esa hora ya tiene otra cita.', 409), cambio: false };
          const antes = c.fecha + ' ' + c.hora; c.fecha = fecha; c.hora = hora; c.movidaPor = 'dueño'; c.cambiada = antes; delete c.r24; delete c.r1;
          anota(db, 'cita movida por el dueño', c.nombre + ' ' + antes + ' → ' + fecha + ' ' + hora);
          return { res: json({ ok: true, tarjeta: db.clientes[c.tel]?.token }), cambio: true };
        });
      }

      if (accion === 'cita') {
        let resena = null;
        const resp = await transaccion((db) => {
          resena = null;
          const c = db.citas.find((x) => x.id === body.id); if (!c) return { res: error('Cita no encontrada.', 404), cambio: false };
          const a = body.accion;
          if (a === 'confirmar' && c.estado === 'pendiente') c.estado = 'confirmada';
          else if (a === 'cancelar' && c.estado !== 'hecha') c.estado = 'cancelada';
          else if (a === 'terminar' && c.estado !== 'hecha' && c.estado !== 'cancelada' && c.estado !== 'ausente') {
            c.estado = 'hecha'; const cl = db.clientes[c.tel];
            const m = c.fecha.slice(0, 7); db.meses = db.meses || {}; const M = db.meses[m] || (db.meses[m] = { total: 0, citas: 0, porPago: {} });
            M.total += c.total; M.citas++; M.porPago[c.pago || 'Sin indicar'] = (M.porPago[c.pago || 'Sin indicar'] || 0) + c.total;
            if (cl) resena = { tel: cl.tel, nombre: cl.nombre, token: cl.token, subs: cl.push || [], id: c.id };
            if (cl) { darSello(cl, (c.lineas[0] || ['Lavado'])[0]); if (c.multa > 0 && cl.multa > 0) { cl.multa = Math.max(0, cl.multa - c.multa); cl.hist.unshift(['Multa pagada en esta cita', hoyCR().fecha]); } }
          }
          else if (a === 'ausente' && (c.estado === 'pendiente' || c.estado === 'confirmada')) {
            c.estado = 'ausente'; const cl = db.clientes[c.tel];
            if (cl) { cl.multa = (cl.multa || 0) + AJUSTES.multa; cl.hist.unshift(['⚠️ No se presentó: multa de ₡' + AJUSTES.multa.toLocaleString('es-CR'), c.fecha]); }
          }
          else if (a === 'pagado' && c.estado !== 'cancelada') c.pagado = !c.pagado;
          else return { res: error('Esa acción no aplica a esta cita.'), cambio: false };
          anota(db, 'cita ' + a, c.nombre + ' ' + c.fecha + ' ' + c.hora);
          return { res: json({ ok: true, estado: c.estado }), cambio: true };
        });
        if (!resena) return resp;
        const via = await pideResena(resena);
        if (via) await transaccion((db) => { const c = db.citas.find((x) => x.id === resena.id); if (c) c.resena = via; return { res: 1, cambio: !!c }; });
        return json({ ok: true, estado: 'hecha', resena: via, resenaUrl: CFG.resena });
      }
      if (accion === 'importar') {                                                // pasar clientes del sistema anterior
        const filas = Array.isArray(body.filas) ? body.filas.slice(0, 500) : [];
        if (!filas.length) return error('No hay clientes para importar.');
        return await transaccion((db) => {
          const r = { creados: 0, repetidos: 0, malos: [] };
          filas.forEach((f, i) => {
            const nombre = limpia(f && f[0], 80), tel = telCR(f && f[1]), carro = limpia(f && f[2], 60);
            const sellos = Math.max(0, Math.min(AJUSTES.meta, parseInt(f && f[3], 10) || 0));
            if (nombre.length < 2 || !tel) { r.malos.push(i + 1); return; }
            if (db.clientes[tel]) { r.repetidos++; return; }
            const c = nuevoCliente(db, tel, nombre, carro); c.sellos = sellos; c.hist = [['Cliente migrado del sistema anterior' + (sellos ? ' (' + sellos + ' sellos)' : ''), hoyCR().fecha]];
            r.creados++;
          });
          if (r.creados) anota(db, 'clientes importados', String(r.creados));
          return { res: json({ ok: true, ...r }), cambio: r.creados > 0 };
        });
      }
      if (accion === 'cliente') {
        const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), carro = limpia(body.carro, 60);
        if (!nombreOk(nombre)) return error('Revise el nombre.');
        if (!tel) return error('Revise el teléfono (8 dígitos).');
        return await transaccion((db) => {
          const ya = db.clientes[tel]; if (ya) return { res: json({ ok: true, existia: true, tarjeta: ya.token, nombre: ya.nombre, tel }), cambio: false };
          const c = nuevoCliente(db, tel, nombre, carro); anota(db, 'nuevo cliente', nombre);
          return { res: json({ ok: true, existia: false, tarjeta: c.token, nombre, tel }), cambio: true };
        });
      }
      const t = String(body.t || '');
      return await transaccion((db) => {
        const tel = db.tokens[t], c = tel && db.clientes[tel]; if (!c) return { res: error('Tarjeta no encontrada.', 404), cambio: false };
        if (accion === 'tarjeta') return { res: json({ ok: true, tarjeta: vistaTarjeta(c), tel: c.tel }), cambio: false };
        if (accion === 'sello') { if (!darSello(c, limpia(body.motivo, 60) || 'Lavado')) return { res: error('Ya completó los sellos: canjee el premio.'), cambio: false }; anota(db, 'sello', c.nombre + ' ' + c.sellos + '/' + AJUSTES.meta); return { res: json({ ok: true, tarjeta: vistaTarjeta(c) }), cambio: true }; }
        if (accion === 'canjear') { if (c.sellos < AJUSTES.meta) return { res: error('Aún no completa los sellos.'), cambio: false }; c.sellos = 0; c.premios = (c.premios || 0) + 1; c.hist.unshift(['🎁 Premio canjeado: ' + AJUSTES.premio, hoyCR().fecha]); anota(db, 'premio canjeado', c.nombre); return { res: json({ ok: true, tarjeta: vistaTarjeta(c) }), cambio: true }; }
        if (accion === 'pin-reset') { delete c.pinHash; delete c.pinSal; c.fallos = 0; c.bloqueo = 0; anota(db, 'PIN restablecido', c.nombre); return { res: json({ ok: true, tarjeta: c.token, tel: c.tel, nombre: c.nombre }), cambio: true }; }
        if (accion === 'perdonar-multa') { c.multa = 0; c.hist.unshift(['Multa anulada por Monzú', hoyCR().fecha]); anota(db, 'multa anulada', c.nombre); return { res: json({ ok: true }), cambio: true }; }
        if (accion === 'borrar-cliente') { const n = c.nombre; borraCliente(db, tel); anota(db, 'cliente eliminado', n); return { res: json({ ok: true }), cambio: true }; }
        return { res: error('Ruta no encontrada.', 404), cambio: false };
      });
    }
    return error('Ruta no encontrada.', 404);
  } catch (e) {
    console.error('api', ruta, e && e.message);
    return error('Error del servidor. Intente de nuevo.', 500);
  }
}
