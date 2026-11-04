// Monzú Detallados · API de reservas, Monzú Club y panel del dueño.
// Corre como Netlify Function (v2) y guarda los datos en Netlify Blobs (gratis).
import { randomBytes, timingSafeEqual, createHash, scryptSync } from 'node:crypto';

export const config = { path: '/api/*' };

/* ---------- ajustes del negocio ---------- */
const AJUSTES = {
  meta: 10,                                   // sellos para el premio
  premio: 'Lavado Premium gratis',
  horas: ['08:00', '10:00', '13:00', '15:00'], // turnos de cita
  dias: [1, 2, 3, 4, 5, 6],                    // 0=domingo … 6=sábado
  diasAdelante: 45,
  zona: 'America/Costa_Rica',
};
const CLAVE_DEMO = 'monzu2026';               // solo si no se configuró PANEL_CLAVE

/* ---------- almacenamiento ---------- */
async function almacen() {
  if (process.env.MONZU_LOCAL_DB) {          // pruebas locales
    const fs = await import('node:fs');
    const f = process.env.MONZU_LOCAL_DB;
    return {
      get: async () => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null),
      set: async (v) => fs.writeFileSync(f, JSON.stringify(v)),
    };
  }
  const { getStore } = await import('@netlify/blobs');
  const s = getStore({ name: 'monzu', consistency: 'strong' });
  return { get: () => s.get('db', { type: 'json' }), set: (v) => s.setJSON('db', v) };
}
const vacia = () => ({ v: 1, clientes: {}, tokens: {}, citas: [] });
async function leer() { const a = await almacen(); return (await a.get()) || vacia(); }
async function escribir(db) { const a = await almacen(); await a.set(db); }

/* ---------- utilidades ---------- */
const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const error = (msg, status = 400) => json({ ok: false, error: msg }, status);
function limpia(t, max) {
  return String(t ?? '').normalize('NFKC').replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF<>]/g, ' ')
    .replace(/\s{2,}/g, ' ').trim().slice(0, max);
}
const telCR = (t) => { const d = String(t || '').replace(/[^\d+]/g, '').replace(/^\+?506/, ''); return /^[2-8]\d{7}$/.test(d) ? d : null; };
const token = () => randomBytes(18).toString('base64url');
const id = () => randomBytes(6).toString('hex');
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
function ocupadas(db, f) { return db.citas.filter((c) => c.fecha === f && c.estado !== 'cancelada').map((c) => c.hora); }
function horasDe(db, f) {
  const occ = ocupadas(db, f), ahora = hoyCR();
  return AJUSTES.horas.map((h) => ({ h, libre: !occ.includes(h) && !(f === ahora.fecha && h <= ahora.hora) }));
}
const vistaTarjeta = (c) => ({ tienePin: !!c.pinHash, nombre: c.nombre, carro: c.carro || '', sellos: c.sellos, meta: AJUSTES.meta, premio: AJUSTES.premio, premios: c.premios || 0, hist: (c.hist || []).slice(0, 12), codigo: 'MZ-' + c.token.slice(0, 4).toUpperCase() });

/* PIN de Monzú Club: 4 dígitos, guardado cifrado (scrypt) y con bloqueo tras 5 intentos */
const pinOk = (p) => /^\d{4}$/.test(String(p ?? ''));
const hashPin = (pin, sal) => scryptSync(String(pin), sal, 32).toString('base64');
function ponPin(c, pin) { c.pinSal = randomBytes(12).toString('base64'); c.pinHash = hashPin(pin, c.pinSal); c.fallos = 0; c.bloqueo = 0; }
function revisaPin(c, pin) {
  if (!c.pinHash) return 'sinpin';
  if ((c.bloqueo || 0) > Date.now()) return 'bloqueado';
  const a = Buffer.from(hashPin(pin, c.pinSal)), b = Buffer.from(c.pinHash);
  if (pinOk(pin) && a.length === b.length && timingSafeEqual(a, b)) { c.fallos = 0; c.bloqueo = 0; return 'ok'; }
  c.fallos = (c.fallos || 0) + 1; if (c.fallos >= 5) { c.bloqueo = Date.now() + 15 * 60e3; c.fallos = 0; }
  return 'mal';
}
function nuevoCliente(db, tel, nombre, carro) {
  const c = { tel, nombre, carro: carro || '', token: token(), sellos: 0, premios: 0, hist: [['Bienvenida a Monzú Club', hoyCR().fecha]], creado: new Date().toISOString() };
  db.clientes[tel] = c; db.tokens[c.token] = tel; return c;
}
const nombreOk = (n) => /^[\p{L}\p{M} .'’-]{3,80}$/u.test(n);

/* límites simples por IP (memoria de la instancia) */
const golpes = new Map();
function limite(ip, clave, max, ventanaMs) {
  const k = clave + ':' + ip, ahora = Date.now(), l = (golpes.get(k) || []).filter((t) => ahora - t < ventanaMs);
  l.push(ahora); golpes.set(k, l); return l.length > max;
}
function claveOk(req) {
  const real = process.env.PANEL_CLAVE || CLAVE_DEMO;
  const dada = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = createHash('sha256').update(dada).digest(), b = createHash('sha256').update(real).digest();
  return dada.length > 0 && timingSafeEqual(a, b);
}
function darSello(c, motivo) {
  if (c.sellos >= AJUSTES.meta) return false;
  c.sellos += 1; c.hist.unshift(['Sello · ' + motivo, hoyCR().fecha]); c.hist = c.hist.slice(0, 40);
  return true;
}

/* ---------- rutas ---------- */
export default async (req, context) => {
  const url = new URL(req.url);
  const ruta = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'local';
  let body = {};
  if (req.method === 'POST') {
    if (!(req.headers.get('content-type') || '').includes('application/json')) return error('Formato no válido.', 415);
    const txt = await req.text(); if (txt.length > 8000) return error('Solicitud demasiado grande.', 413);
    try { body = JSON.parse(txt || '{}'); } catch { return error('JSON inválido.'); }
  }
  try {
    /* --- público --- */
    if (ruta === 'horarios' && req.method === 'GET') {
      const f = url.searchParams.get('fecha'); const m = fechaValida(f);
      if (m) return json({ ok: true, fecha: f, cerrado: true, motivo: m, horas: [] });
      const db = await leer(); return json({ ok: true, fecha: f, cerrado: false, horas: horasDe(db, f) });
    }
    if (ruta === 'reservar' && req.method === 'POST') {
      if (body.web) return json({ ok: true });                       // trampa anti robots
      if (limite(ip, 'res', 6, 3600e3)) return error('Demasiadas reservas desde esta conexión. Escríbanos por WhatsApp.', 429);
      const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), lugar = limpia(body.lugar, 120), carro = limpia(body.carro, 60), nota = limpia(body.nota, 400);
      const fecha = String(body.fecha || ''), hora = String(body.hora || '');
      if (!nombreOk(nombre)) return error('Revise su nombre.');
      if (!tel) return error('Revise el teléfono (8 dígitos).');
      if (body.pin && !pinOk(body.pin)) return error('El PIN debe tener 4 números.');
      if (lugar.length < 4) return error('Falta la dirección o zona.');
      const m = fechaValida(fecha); if (m) return error(m);
      if (!AJUSTES.horas.includes(hora)) return error('Elija una hora de la lista.');
      if (!body.consentimiento) return error('Debe aceptar los términos y autorizar el uso de sus datos.');
      const lineas = (Array.isArray(body.lineas) ? body.lineas : []).slice(0, 8).map((l) => [limpia(l && l[0], 80), Math.max(0, Math.min(500000, parseInt(l && l[1], 10) || 0))]).filter((l) => l[0]);
      if (!lineas.length) return error('Elija un paquete o un adicional.');
      const total = lineas.reduce((a, l) => a + l[1], 0);
      const db = await leer();
      if (!horasDe(db, fecha).find((x) => x.h === hora && x.libre)) return error('Esa hora se acaba de ocupar. Elija otra, por favor.', 409);
      if (db.citas.filter((c) => c.tel === tel && c.estado !== 'cancelada' && c.estado !== 'hecha').length >= 3) return error('Ya tiene 3 citas pendientes. Escríbanos por WhatsApp para cambiarlas.');
      let c = db.clientes[tel], nueva = false, tk = null, aviso = '';
      if (!c) { c = nuevoCliente(db, tel, nombre, carro); nueva = true; if (pinOk(body.pin)) ponPin(c, body.pin); tk = c.token; }
      else {
        if (carro && !c.carro) c.carro = carro;
        if (!c.pinHash) aviso = 'sinpin';
        else if (!body.pin) aviso = 'conpin';
        else { const r = revisaPin(c, String(body.pin)); if (r === 'ok') tk = c.token; else aviso = r === 'bloqueado' ? 'bloqueado' : 'pinmal'; }
      }
      const cita = { id: id(), tel, nombre, fecha, hora, vehiculo: limpia(body.vehiculo, 30), carro, lineas, total, desde: !!body.desde, aroma: limpia(body.aroma, 30), lugar, nota, estado: 'pendiente', creada: new Date().toISOString() };
      db.citas.push(cita);
      db.citas = db.citas.filter((x) => x.fecha >= sumaDias(hoyCR().fecha, -120)).slice(-2000);
      await escribir(db);
      return json({ ok: true, cita: { id: cita.id, fecha, hora }, tarjeta: tk, nueva, aviso, tienePin: !!c.pinHash });
    }
    if (ruta === 'registro' && req.method === 'POST') {
      if (body.web) return json({ ok: true });
      if (limite(ip, 'reg', 8, 3600e3)) return error('Demasiados registros desde esta conexión. Intente más tarde.', 429);
      const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), carro = limpia(body.carro, 60);
      if (!nombreOk(nombre)) return error('Revise su nombre.');
      if (!tel) return error('Revise el teléfono (8 dígitos).');
      if (!pinOk(body.pin)) return error('El PIN debe tener 4 números.');
      if (!body.consentimiento) return error('Debe aceptar los términos y autorizar el uso de sus datos.');
      const db = await leer(), ya = db.clientes[tel];
      if (ya) return error(ya.pinHash ? 'Ese teléfono ya está en Monzú Club. Entre con su teléfono y su PIN.' : 'Ese teléfono ya tiene tarjeta. Ábrala con el enlace que le enviamos por WhatsApp para crear su PIN, o pídanos el enlace.', 409);
      const c = nuevoCliente(db, tel, nombre, carro); ponPin(c, body.pin);
      await escribir(db); return json({ ok: true, tarjeta: c.token });
    }
    if (ruta === 'entrar' && req.method === 'POST') {
      if (limite(ip, 'ent', 20, 900e3)) return error('Demasiados intentos. Espere 15 minutos.', 429);
      const tel = telCR(body.tel); if (!tel || !pinOk(body.pin)) return error('Escriba su teléfono (8 dígitos) y su PIN (4 números).');
      const db = await leer(), c = db.clientes[tel];
      if (!c) return error('Teléfono o PIN incorrectos.', 401);
      const r = revisaPin(c, String(body.pin));
      if (r === 'sinpin') return error('Su tarjeta todavía no tiene PIN. Ábrala con el enlace que le enviamos por WhatsApp para crearlo, o pídanos el enlace.', 403);
      await escribir(db);
      if (r === 'bloqueado') return error('Demasiados intentos con ese teléfono. Espere 15 minutos o pida a Monzú que le restablezca el PIN.', 429);
      if (r !== 'ok') return error('Teléfono o PIN incorrectos.', 401);
      return json({ ok: true, tarjeta: c.token });
    }
    if (ruta === 'pin' && req.method === 'POST') {
      const t = String(body.t || ''); if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      if (!pinOk(body.pin)) return error('El PIN debe tener 4 números.');
      const db = await leer(), tel = db.tokens[t], c = tel && db.clientes[tel];
      if (!c) return error('Tarjeta no encontrada.', 404);
      if (c.pinHash) return error('Esta tarjeta ya tiene PIN. Si lo olvidó, pídale a Monzú que se lo restablezca.', 409);
      ponPin(c, body.pin); await escribir(db); return json({ ok: true });
    }
    if (ruta === 'tarjeta' && req.method === 'GET') {
      const t = url.searchParams.get('t') || ''; if (!/^[\w-]{20,40}$/.test(t)) return error('Tarjeta no encontrada.', 404);
      const db = await leer(); const tel = db.tokens[t]; const c = tel && db.clientes[tel];
      if (!c) return error('Tarjeta no encontrada.', 404);
      const prox = db.citas.filter((x) => x.tel === tel && (x.estado === 'pendiente' || x.estado === 'confirmada') && x.fecha >= hoyCR().fecha).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
      return json({ ok: true, tarjeta: vistaTarjeta(c), proxima: prox ? { fecha: prox.fecha, hora: prox.hora, estado: prox.estado } : null });
    }

    /* --- panel del dueño --- */
    if (ruta.startsWith('panel/')) {
      if (limite(ip, 'panel', 120, 60e3)) return error('Demasiadas solicitudes. Espere un minuto.', 429);
      if (!claveOk(req)) { if (limite(ip, 'fallo', 8, 900e3)) return error('Demasiados intentos. Espere 15 minutos.', 429); return error('Contraseña incorrecta.', 401); }
      const accion = ruta.slice(6), db = await leer();
      const demo = !process.env.PANEL_CLAVE;
      if (accion === 'resumen' && req.method === 'GET') {
        const desde = sumaDias(hoyCR().fecha, -7);
        const citas = db.citas.filter((c) => c.fecha >= desde).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
          .map((c) => ({ ...c, sellos: db.clientes[c.tel]?.sellos ?? 0, tarjeta: db.clientes[c.tel]?.token }));
        const clientes = Object.values(db.clientes).map((c) => ({ nombre: c.nombre, tel: c.tel, carro: c.carro || '', sellos: c.sellos, premios: c.premios || 0, tarjeta: c.token, tienePin: !!c.pinHash, creado: c.creado || '' }))
          .sort((a, b) => b.sellos - a.sellos || a.nombre.localeCompare(b.nombre));
        return json({ ok: true, hoy: hoyCR().fecha, meta: AJUSTES.meta, premio: AJUSTES.premio, demo, citas, clientes });
      }
      if (accion === 'cita' && req.method === 'POST') {
        const c = db.citas.find((x) => x.id === body.id); if (!c) return error('Cita no encontrada.', 404);
        const a = body.accion;
        if (a === 'confirmar' && c.estado === 'pendiente') c.estado = 'confirmada';
        else if (a === 'cancelar' && c.estado !== 'hecha') c.estado = 'cancelada';
        else if (a === 'terminar' && c.estado !== 'hecha' && c.estado !== 'cancelada') { c.estado = 'hecha'; const cl = db.clientes[c.tel]; if (cl) darSello(cl, (c.lineas[0] || ['Lavado'])[0]); }
        else return error('Esa acción no aplica a esta cita.');
        await escribir(db); return json({ ok: true, estado: c.estado });
      }
      if (accion === 'cliente' && req.method === 'POST') {
        const nombre = limpia(body.nombre, 80), tel = telCR(body.tel), carro = limpia(body.carro, 60);
        if (!nombreOk(nombre)) return error('Revise el nombre.');
        if (!tel) return error('Revise el teléfono (8 dígitos).');
        const ya = db.clientes[tel]; if (ya) return json({ ok: true, existia: true, tarjeta: ya.token, nombre: ya.nombre, tel });
        const c = nuevoCliente(db, tel, nombre, carro); await escribir(db);
        return json({ ok: true, existia: false, tarjeta: c.token, nombre, tel });
      }
      if (accion === 'pin-reset' && req.method === 'POST') {
        const tel = db.tokens[String(body.t || '')], c = tel && db.clientes[tel]; if (!c) return error('Tarjeta no encontrada.', 404);
        delete c.pinHash; delete c.pinSal; c.fallos = 0; c.bloqueo = 0; await escribir(db);
        return json({ ok: true, tarjeta: c.token, tel: c.tel, nombre: c.nombre });
      }
      if ((accion === 'sello' || accion === 'canjear' || accion === 'tarjeta') ) {
        const t = String((req.method === 'GET' ? url.searchParams.get('t') : body.t) || '');
        const tel = db.tokens[t]; const c = tel && db.clientes[tel]; if (!c) return error('Tarjeta no encontrada.', 404);
        if (accion === 'tarjeta') return json({ ok: true, tarjeta: vistaTarjeta(c), tel: c.tel });
        if (req.method !== 'POST') return error('Método no permitido.', 405);
        if (accion === 'sello') { if (!darSello(c, limpia(body.motivo, 60) || 'Lavado')) return error('Ya completó los sellos: canjee el premio.'); }
        else { if (c.sellos < AJUSTES.meta) return error('Aún no completa los sellos.'); c.sellos = 0; c.premios = (c.premios || 0) + 1; c.hist.unshift(['🎁 Premio canjeado: ' + AJUSTES.premio, hoyCR().fecha]); }
        await escribir(db); return json({ ok: true, tarjeta: vistaTarjeta(c) });
      }
      return error('Ruta no encontrada.', 404);
    }
    return error('Ruta no encontrada.', 404);
  } catch (e) {
    console.error(e);
    return error('Error del servidor. Intente de nuevo.', 500);
  }
};
