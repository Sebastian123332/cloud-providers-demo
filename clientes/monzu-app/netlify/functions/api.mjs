// Monzú Detallados · API de reservas, Monzú Club y panel del dueño.
// Netlify Function (v2) + Netlify Blobs. Versión de producción con medidas de seguridad:
// - escrituras atómicas (sin pérdidas si dos personas reservan a la vez)
// - panel con sesión firmada (la contraseña nunca se guarda en el celular)
// - bloqueo global de intentos (contraseña del panel y PIN de clientes)
// - PIN cifrado con scrypt, IP guardada solo como huella (hash), límites diarios anti abuso
// - verificación de origen (anti CSRF), cabeceras seguras, bitácora de acciones del dueño
import { randomBytes, timingSafeEqual, createHash, createHmac, scryptSync } from 'node:crypto';

export const config = { path: '/api/*' };

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
};

/* ---------- precios oficiales: el servidor calcula el total, no confía en el navegador ---------- */
const CATALOGO = {
  paq: { premium: { n: 'Detallado Premium', sedan: 16000, suv: 18000 }, deluxe: { n: 'Detallado Deluxe', sedan: 32000, suv: 35000 } },
  ext: {
    motor: { n: 'Limpieza de motor', p: 8000, conPaq: 5000 }, asientos: { n: 'Limpieza de asientos', p: 25000 }, techo: { n: 'Limpieza de techo', p: 10000 },
    tapiceria: { n: 'Tapicería completa', p: 30000, desde: true }, colchon: { n: 'Limpieza de colchón', p: 10000 },
  },
};
function cotiza(veh, paq, extras) {
  const v = veh === 'suv' ? 'suv' : 'sedan', lineas = []; let desde = false;
  const P = CATALOGO.paq[paq]; if (P) lineas.push([P.n + (v === 'sedan' ? ' · sedán' : ' · SUV/pick up'), P[v]]);
  [...new Set(Array.isArray(extras) ? extras.map(String) : [])].slice(0, 8).forEach((k) => {
    const x = CATALOGO.ext[k]; if (!x) return; if (x.desde) desde = true;
    lineas.push([x.n + (x.desde ? ' (desde)' : ''), x.conPaq && P ? x.conPaq : x.p]);
  });
  return { v, lineas, desde, total: lineas.reduce((a, l) => a + l[1], 0), vehiculo: v === 'sedan' ? 'Sedán' : 'SUV / Pick up / XL' };
}

/* ---------- almacenamiento con escritura atómica ---------- */
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function almacen() {
  if (process.env.MONZU_LOCAL_DB) {           // solo para pruebas locales
    const fs = await import('node:fs');
    const f = (k) => process.env.MONZU_LOCAL_DB.replace(/\.json$/, '') + '-' + k + '.json';
    const h = (s) => createHash('sha1').update(s).digest('hex');
    return {
      leer: async (k) => { if (!fs.existsSync(f(k))) return null; const s = fs.readFileSync(f(k), 'utf8'); return { data: JSON.parse(s), etag: h(s) }; },
      escribir: async (k, v, etag) => {
        const actual = fs.existsSync(f(k)) ? h(fs.readFileSync(f(k), 'utf8')) : null;
        if ((etag || null) !== actual) return false;
        fs.writeFileSync(f(k), JSON.stringify(v)); return true;
      },
    };
  }
  const { getStore } = await import('@netlify/blobs');
  const s = getStore({ name: 'monzu', consistency: 'strong' });
  return {
    leer: (k) => s.getWithMetadata(k, { type: 'json' }),
    escribir: async (k, v, etag) => (await s.setJSON(k, v, etag ? { onlyIfMatch: etag } : { onlyIfNew: true })).modified,
  };
}
const vacia = () => ({ v: 2, clientes: {}, tokens: {}, citas: [], cuotas: {}, bitacora: [] });
async function leerDB(k = 'db') { const a = await almacen(); const r = await a.leer(k); return (r && r.data) || (k === 'db' ? vacia() : {}); }
// fn(db) devuelve { res, cambio }. Si otro escribió en medio, se repite con los datos nuevos.
async function transaccion(fn, k = 'db') {
  const a = await almacen();
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
  if (!AJUSTES.dias.includes(diaSemana(f))) return 'Ese día no hay citas.';
  return null;
}
function horasDe(db, f) {
  const occ = db.citas.filter((c) => c.fecha === f && c.estado !== 'cancelada').map((c) => c.hora), ahora = hoyCR();
  return AJUSTES.horas.map((h) => ({ h, libre: !occ.includes(h) && !(f === ahora.fecha && h <= ahora.hora) }));
}
const vistaTarjeta = (c) => ({ tienePin: !!c.pinHash, nombre: c.nombre, carro: c.carro || '', sellos: c.sellos, meta: AJUSTES.meta, premio: AJUSTES.premio, premios: c.premios || 0, hist: (c.hist || []).slice(0, 12), codigo: 'MZ-' + c.token.slice(0, 4).toUpperCase() });
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
const claveReal = () => process.env.PANEL_CLAVE || '';
const panelListo = () => claveReal().length >= 10;
const llaveSesion = (v) => createHash('sha256').update('monzu-sesion|' + claveReal() + '|' + (process.env.SESION_SECRETO || '') + '|' + v).digest();
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
  const a = createHash('sha256').update(String(dada || '')).digest(), b = createHash('sha256').update(claveReal()).digest();
  return String(dada || '').length > 0 && timingSafeEqual(a, b);
}

/* ---------- rutas ---------- */
export default async (req, context) => {
  const url = new URL(req.url);
  const ruta = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'local';
  if (req.method !== 'GET' && req.method !== 'POST') return error('Método no permitido.', 405);
  let body = {};
  if (req.method === 'POST') {
    const origen = req.headers.get('origin');                                 // anti CSRF: solo desde la propia página
    if (origen && new URL(origen).host !== url.host) return error('Origen no permitido.', 403);
    if (!(req.headers.get('content-type') || '').includes('application/json')) return error('Formato no válido.', 415);
    const txt = await req.text(); if (txt.length > 8000) return error('Solicitud demasiado grande.', 413);
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
      if (!AJUSTES.horas.includes(hora)) return error('Elija una hora de la lista.');
      if (body.consentimiento !== true) return error('Debe aceptar los términos y autorizar el uso de sus datos.');
      const q = cotiza(body.veh, body.paq, body.extras), lineas = q.lineas, total = q.total;
      if (!lineas.length) return error('Elija un paquete o un adicional.');
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
        const cita = { id: id(), tel, nombre, fecha, hora, vehiculo: q.vehiculo, carro, lineas, total, desde: q.desde, aroma: limpia(body.aroma, 30), lugar, nota, estado: 'pendiente', creada: new Date().toISOString(), origen: huella(ip) };
        db.citas.push(cita); purga(db);
        return { res: json({ ok: true, cita: { id: cita.id, fecha, hora }, tarjeta: tk, nueva, aviso, tienePin: !!c.pinHash }), cambio: true };
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

    if (ruta === 'tarjeta' && req.method === 'GET') {
      if (limite(ip, 'tj', 60, 60e3)) return error('Demasiadas consultas. Espere un minuto.', 429);
      const t = url.searchParams.get('t') || ''; if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      const db = await leerDB(); const tel = db.tokens[t]; const c = tel && db.clientes[tel];
      if (!c) return error('Tarjeta no encontrada.', 404);
      const prox = db.citas.filter((x) => x.tel === tel && (x.estado === 'pendiente' || x.estado === 'confirmada') && x.fecha >= hoyCR().fecha).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
      return json({ ok: true, tarjeta: vistaTarjeta(c), proxima: prox ? { fecha: prox.fecha, hora: prox.hora, estado: prox.estado } : null });
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
          .map(({ origen, ...c }) => ({ ...c, sellos: db.clientes[c.tel]?.sellos ?? 0, tarjeta: db.clientes[c.tel]?.token }));
        const clientes = Object.values(db.clientes).map((c) => ({ nombre: c.nombre, tel: c.tel, carro: c.carro || '', sellos: c.sellos, premios: c.premios || 0, tarjeta: c.token, tienePin: !!c.pinHash, creado: c.creado || '' }))
          .sort((a, b) => b.sellos - a.sellos || a.nombre.localeCompare(b.nombre));
        return json({ ok: true, hoy: hoyCR().fecha, meta: AJUSTES.meta, premio: AJUSTES.premio, citas, clientes });
      }
      if (accion === 'respaldo' && req.method === 'GET') {                       // copia de seguridad para el dueño (sin PIN)
        const db = await leerDB();
        const clientes = Object.values(db.clientes).map(({ pinHash, pinSal, fallos, bloqueo, token: tk, ...c }) => ({ ...c, tienePin: !!pinHash }));
        const citas = db.citas.map(({ origen, ...c }) => c);
        return new Response(JSON.stringify({ generado: new Date().toISOString(), negocio: 'Monzú Detallados', clientes, citas, bitacora: db.bitacora || [] }, null, 1),
          { status: 200, headers: { ...H, 'content-disposition': 'attachment; filename="monzu-respaldo-' + hoyCR().fecha + '.json"' } });
      }
      if (req.method !== 'POST') return error('Ruta no encontrada.', 404);

      if (accion === 'cita') {
        return await transaccion((db) => {
          const c = db.citas.find((x) => x.id === body.id); if (!c) return { res: error('Cita no encontrada.', 404), cambio: false };
          const a = body.accion;
          if (a === 'confirmar' && c.estado === 'pendiente') c.estado = 'confirmada';
          else if (a === 'cancelar' && c.estado !== 'hecha') c.estado = 'cancelada';
          else if (a === 'terminar' && c.estado !== 'hecha' && c.estado !== 'cancelada') { c.estado = 'hecha'; const cl = db.clientes[c.tel]; if (cl) darSello(cl, (c.lineas[0] || ['Lavado'])[0]); }
          else return { res: error('Esa acción no aplica a esta cita.'), cambio: false };
          anota(db, 'cita ' + a, c.nombre + ' ' + c.fecha + ' ' + c.hora);
          return { res: json({ ok: true, estado: c.estado }), cambio: true };
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
        if (accion === 'borrar-cliente') { const n = c.nombre; borraCliente(db, tel); anota(db, 'cliente eliminado', n); return { res: json({ ok: true }), cambio: true }; }
        return { res: error('Ruta no encontrada.', 404), cambio: false };
      });
    }
    return error('Ruta no encontrada.', 404);
  } catch (e) {
    console.error('api', ruta, e && e.message);
    return error('Error del servidor. Intente de nuevo.', 500);
  }
};
