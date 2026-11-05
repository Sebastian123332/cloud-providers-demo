// Pruebas de seguridad contra la API local (como lo intentaría un atacante).
const B = 'http://localhost:8790/api/';
const R = {};
const post = (r, d, h = {}) => fetch(B + r, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:8790', ...h }, body: JSON.stringify(d) }).then(async (x) => ({ s: x.status, j: await x.json().catch(() => ({})) }));
const get = (r, h = {}) => fetch(B + r, { headers: h }).then(async (x) => ({ s: x.status, j: await x.json().catch(() => ({})), h: x.headers }));
const fecha = (() => { const d = new Date(Date.now() + 3 * 864e5); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
const base = { lugar: 'Cartago centro', fecha, paq: 'premium', veh: 'sedan', lineas: [['Detallado Premium', 16000]], consentimiento: true, vehiculo: 'Sedán' };

// 1) CSRF: desde otro sitio
R.csrf = (await post('registro', { nombre: 'Malo', tel: '87000001', pin: '1234', consentimiento: true }, { origin: 'https://sitio-malo.com' })).s;
// 2) panel sin sesión / sesión falsa
R.sinSesion = (await get('panel/resumen')).s;
R.sesionFalsa = (await get('panel/resumen', { authorization: 'Bearer eyJleHAiOjk5OTk5OTk5OTk5OTl9.firmaFalsa' })).s;
R.claveComoBearer = (await get('panel/resumen', { authorization: 'Bearer ' + process.env.CLAVE })).s; // la contraseña ya no sirve como llave directa
// 3) entrar bien y obtener sesión
const lg = await post('panel/login', { clave: process.env.CLAVE });
R.loginBueno = lg.s; const S = { authorization: 'Bearer ' + lg.j.sesion };
R.conSesion = (await get('panel/resumen', S)).s;
// 4) 10 reservas al mismo tiempo en la misma hora: solo 1 debe entrar
const carrera = await Promise.all(Array.from({ length: 10 }, (_, i) => post('reservar', { ...base, nombre: 'Cliente Carrera', tel: '8' + String(7100000 + i), hora: '10:00' })));
R.carrera = { exitosas: carrera.filter((x) => x.j.ok).length, rechazadas409: carrera.filter((x) => x.s === 409).length };
// 5) inyección de código en los campos
const xss = await post('reservar', { ...base, nombre: 'Ana Pérez', tel: '87200000', hora: '13:00', nota: '<img src=x onerror=alert(1)><script>alert(2)</script>', lugar: 'Cartago <b>centro</b>' });
const res = await get('panel/resumen', S); const cx = res.j.citas.find((c) => c.tel === '87200000');
R.xss = { reservo: xss.j.ok, notaGuardada: cx && cx.nota, tieneSignos: !!cx && /[<>]/.test(cx.nota + cx.lugar) };
R.nombreConCodigo = (await post('registro', { nombre: '<script>x</script>', tel: '87300000', pin: '1234', consentimiento: true })).j.error;
// 6) respaldo sin datos secretos
const rsp = await fetch(B + 'panel/respaldo', { headers: S }); const txt = await rsp.text();
R.respaldo = { estado: rsp.status, tienePinHash: txt.includes('pinHash'), tieneSal: txt.includes('pinSal'), tieneTokens: /"token"/.test(txt), descarga: rsp.headers.get('content-disposition') };
// 7) borrar tarjeta ajena sin PIN
const reg = await post('registro', { nombre: 'Victima Prueba', tel: '87400000', pin: '4321', consentimiento: true });
R.borrarSinPin = (await post('borrar-tarjeta', { t: reg.j.tarjeta, pin: '0000' })).s;
R.borrarConPin = (await post('borrar-tarjeta', { t: reg.j.tarjeta, pin: '4321' })).j.ok;
R.tarjetaBorrada = (await get('tarjeta?t=' + reg.j.tarjeta)).s;
// 8) cabeceras de la API
const hh = (await get('horarios?fecha=' + fecha)).h;
R.cabeceras = { nosniff: hh.get('x-content-type-options'), cache: hh.get('cache-control'), corp: hh.get('cross-origin-resource-policy'), cors: hh.get('access-control-allow-origin') };
// 9) métodos raros
R.metodoDELETE = (await fetch(B + 'horarios', { method: 'DELETE' })).status;
R.noJSON = (await fetch(B + 'registro', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' })).status;
// 10) cerrar todas las sesiones: la sesión vieja deja de servir
await post('panel/cerrar-todo', {}, S);
R.sesionTrasCerrarTodo = (await get('panel/resumen', S)).s;
// 11) fuerza bruta a la contraseña del panel: a los 8 fallos se bloquea aunque luego ponga la buena
for (let i = 0; i < 8; i++) await post('panel/login', { clave: 'adivinando' + i });
R.fuerzaBruta = (await post('panel/login', { clave: process.env.CLAVE })).s;
console.log(JSON.stringify(R, null, 1));
// 12) precio manipulado: el navegador manda ₡1, el servidor usa el precio oficial
const f2 = (() => { const d = new Date(Date.now() + 5 * 864e5); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
const trampa = await fetch(B + 'reservar', { method: 'POST', headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': '10.9.9.9' }, body: JSON.stringify({ nombre: 'Tramposo Prueba', tel: '87500000', fecha: f2, hora: '08:00', lugar: 'Cartago centro', consentimiento: true, paq: 'deluxe', veh: 'suv', extras: ['motor', 'inventado'], lineas: [['Detallado Deluxe', 1]] }) }).then((x) => x.json());
const s2 = (await fetch(B + 'panel/login', { method: 'POST', headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': '10.9.9.8' }, body: JSON.stringify({ clave: process.env.CLAVE }) }).then((x) => x.json())).sesion;
const c2 = s2 && (await fetch(B + 'panel/resumen', { headers: { authorization: 'Bearer ' + s2 } }).then((x) => x.json())).citas.find((c) => c.tel === '87500000');
console.log('precio manipulado ->', JSON.stringify({ reservo: trampa.ok, total: c2 && c2.total, lineas: c2 && c2.lineas }));
