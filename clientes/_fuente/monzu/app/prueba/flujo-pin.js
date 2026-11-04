// Prueba del registro público con teléfono + PIN.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const B = 'http://localhost:8790', O = __dirname + '/cap/';
fs.mkdirSync(O, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const R = {};
function vigila(p, nom, errs) {
  p.on('pageerror', (e) => errs.push(nom + ': ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::|status of 40[1349]|status of 429/.test(m.text())) errs.push(nom + ' console: ' + m.text()); });
}
async function api(p, ruta, datos) { return p.evaluate(async ([r, d]) => (await fetch('/api/' + r, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) })).json(), [ruta, datos]); }
(async () => {
  const errs = []; const b = await chromium.launch();
  const nuevoCel = async () => { const c = await b.newContext({ ...devices['iPhone 13'] }); await c.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort()); const p = await c.newPage(); vigila(p, 'cel', errs); return { c, p }; };
  // 1) registro público
  const A = await nuevoCel();
  await A.p.goto(B + '/tarjeta.html#registro'); await sleep(500);
  await A.p.screenshot({ path: O + 'p1-registro.png' });
  await A.p.fill('#rNombre', 'Carlos Brenes'); await A.p.fill('#rTel', '8777-1122'); await A.p.fill('#rCarro', 'Hyundai Tucson');
  await A.p.fill('#rPin', '4821'); await A.p.fill('#rPin2', '4821'); await A.p.check('#rOk');
  await A.p.tap('#bRegistro'); await A.p.waitForSelector('#vista:not([hidden])'); await sleep(1500);
  R.registro = { url: A.p.url().includes('?t='), nombre: await A.p.textContent('#tjNombre'), crearPinVisible: await A.p.isVisible('#crearPin'), usuario: await A.p.textContent('#usuario') };
  await A.p.screenshot({ path: O + 'p2-tarjeta-nueva.png' });
  // registrar otra vez el mismo teléfono
  R.dobleRegistro = (await api(A.p, 'registro', { nombre: 'Otro', tel: '87771122', pin: '1111', consentimiento: true })).error;
  // 2) entrar desde OTRO celular con teléfono + PIN
  const Bc = await nuevoCel();
  await Bc.p.goto(B + '/tarjeta.html'); await sleep(400);
  await Bc.p.screenshot({ path: O + 'p3-entrar.png' });
  await Bc.p.fill('#eTel', '8777 1122'); await Bc.p.fill('#ePin', '0000'); await Bc.p.tap('#bEntrar'); await sleep(500);
  R.pinMalo = await Bc.p.textContent('#mEntrar');
  await Bc.p.fill('#ePin', '4821'); await Bc.p.tap('#bEntrar'); await Bc.p.waitForSelector('#vista:not([hidden])');
  R.entrarOtroCel = await Bc.p.textContent('#tjNombre');
  // salir
  Bc.p.once('dialog', (d) => d.accept()); await Bc.p.tap('#btnSalir'); await sleep(300);
  R.trasSalir = await Bc.p.isVisible('#fEntrar');
  // 3) bloqueo tras 5 intentos
  for (let i = 0; i < 5; i++) await api(Bc.p, 'entrar', { tel: '87771122', pin: '999' + i });
  R.bloqueo = (await api(Bc.p, 'entrar', { tel: '87771122', pin: '4821' })).error;
  // 4) reservar con el teléfono de otra persona SIN su PIN: no debe devolver la tarjeta
  const f = await A.p.evaluate(() => { const d = new Date(Date.now() + 2 * 864e5); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); });
  const base = { nombre: 'Intruso Prueba', lugar: 'Cartago centro', fecha: f, lineas: [['Detallado Premium', 16000]], consentimiento: true, vehiculo: 'Sedán' };
  const ajeno = await api(A.p, 'reservar', { ...base, tel: '87771122', hora: '10:00' });
  R.reservaAjena = { ok: ajeno.ok, tarjeta: ajeno.tarjeta, aviso: ajeno.aviso };
  // 5) cliente nuevo que reserva SIN PIN -> recibe su tarjeta y la página le pide crear PIN
  const sinPin = await api(A.p, 'reservar', { ...base, nombre: 'Daniela Solís', tel: '86665544', hora: '13:00' });
  const D = await nuevoCel(); await D.p.goto(B + '/tarjeta.html?t=' + sinPin.tarjeta); await D.p.waitForSelector('#vista:not([hidden])'); await sleep(300);
  R.pidePin = await D.p.isVisible('#crearPin');
  await D.p.screenshot({ path: O + 'p4-crear-pin.png' });
  await D.p.fill('#nPin', '7777'); await D.p.fill('#nPin2', '7777'); await D.p.tap('#crearPin button'); await sleep(800);
  R.pinCreado = !(await D.p.isVisible('#crearPin'));
  R.entrarConPinNuevo = (await api(D.p, 'entrar', { tel: '86665544', pin: '7777' })).ok;
  // 6) panel: nuevo cliente y restablecer PIN
  const P = await nuevoCel(); await P.p.goto(B + '/panel.html'); await P.p.fill('#clave', 'monzu2026'); await P.p.tap('#entrar'); await P.p.waitForSelector('#app:not([hidden])');
  await P.p.tap('.tabs button[data-sec="clientes"]'); await P.p.tap('#nuevoCli summary');
  await P.p.fill('#nNombre', 'Luis Quesada'); await P.p.fill('#nTel', '8555-0099');
  const [wa] = await Promise.all([P.c.waitForEvent('page').catch(() => null), P.p.tap('#fNuevo button')]); if (wa) { R.waNuevo = decodeURIComponent(wa.url()).slice(0, 80); await wa.close(); }
  await sleep(1200);
  R.sinPinEtiqueta = await P.p.evaluate(() => [...document.querySelectorAll('.cli')].filter((c) => c.textContent.includes('Luis Quesada') && c.textContent.includes('Sin PIN')).length);
  await P.p.screenshot({ path: O + 'p5-panel-clientes.png', fullPage: true });
  P.p.once('dialog', (d) => d.accept());
  const btnRes = await P.p.evaluateHandle(() => [...document.querySelectorAll('.cli')].find((c) => c.textContent.includes('Daniela')).querySelector('.b-bor'));
  const [wa2] = await Promise.all([P.c.waitForEvent('page').catch(() => null), btnRes.asElement().tap()]); if (wa2) await wa2.close();
  await sleep(800);
  R.trasRestablecer = (await api(P.p, 'entrar', { tel: '86665544', pin: '7777' })).error;
  console.log(JSON.stringify(R, null, 1)); console.log('errores', errs);
  await b.close();
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
