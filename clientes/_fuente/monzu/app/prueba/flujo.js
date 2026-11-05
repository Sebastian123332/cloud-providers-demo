// Prueba de punta a punta: cliente reserva -> tarjeta -> dueño confirma, da sello y escanea con cámara (falsa) el QR.
const { chromium, devices } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const B = 'http://localhost:8790', O = __dirname + '/cap/';
fs.mkdirSync(O, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fechaCita() { const d = new Date(Date.now() + 864e5); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
function vigila(p, nom, errs) {
  p.on('pageerror', (e) => errs.push(nom + ' pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(nom + ' console: ' + m.text()); });
}
(async () => {
  const errs = [];
  const b1 = await chromium.launch();
  // ---------- CLIENTE ----------
  const cctx = await b1.newContext({ ...devices['iPhone 13'] });
  await cctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  const c = await cctx.newPage(); vigila(c, 'index', errs);
  await c.goto(B + '/'); await sleep(800);
  await c.evaluate(() => document.getElementById('agendar').scrollIntoView());
  const f = fechaCita();
  await c.evaluate((f) => { const i = document.getElementById('fFecha'); i.value = f; i.dispatchEvent(new Event('change', { bubbles: true })); }, f);
  await c.waitForSelector('#horas .hora:not([disabled])');
  await c.evaluate(() => document.getElementById('horas').scrollIntoView({ block: 'center' })); await sleep(1500);
  await c.screenshot({ path: O + 'c1-horas.png', fullPage: false });
  await c.tap('#horas .hora:not([disabled])');
  await c.fill('#fNombre', 'Andrea Mora'); await c.fill('#fTel', '8811-2233'); await c.fill('#fLugar', 'Tres Ríos, La Unión, casa 25'); await c.fill('#fVeh', 'Toyota RAV4 2019');
  await c.check('#okTerminos'); await c.check('#okDatos'); await sleep(3100);
  await c.tap('#enviar'); await c.waitForSelector('#listo:not([hidden])', { timeout: 8000 });
  await c.evaluate(() => document.getElementById('listo').scrollIntoView({ block: 'center' })); await sleep(300);
  await c.screenshot({ path: O + 'c2-reservada.png' });
  const enlace = await c.getAttribute('#listoTarjeta', 'href');
  // la misma hora ya no se puede reservar
  const doble = await c.evaluate(async (f) => { const r = await fetch('/api/horarios?fecha=' + f); return (await r.json()).horas; }, f);
  const tarjeta = await cctx.newPage(); vigila(tarjeta, 'tarjeta', errs);
  await tarjeta.goto(B + '/' + enlace); await tarjeta.waitForSelector('#vista:not([hidden])');
  await sleep(400); await tarjeta.screenshot({ path: O + 'c3-tarjeta0.png' });
  // QR de la tarjeta -> video para la cámara falsa del dueño
  const qrPng = O + 'qr.png'; await (await tarjeta.$('#qr')).screenshot({ path: qrPng });
  execFileSync('python3', [__dirname + '/a_y4m.py', qrPng, O + 'qr.y4m']);
  // ---------- DUEÑO ----------
  const b2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + O + 'qr.y4m'] });
  const dctx = await b2.newContext({ ...devices['Pixel 7'], permissions: ['camera'] });
  await dctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  const p = await dctx.newPage(); vigila(p, 'panel', errs);
  await p.goto(B + '/panel.html'); await p.fill('#clave', 'mala'); await p.tap('#entrar'); await sleep(500);
  const malMsg = await p.textContent('#loginMsg');
  await p.fill('#clave', 'MonzuPrueba2026'); await p.tap('#entrar'); await p.waitForSelector('#app:not([hidden])');
  await p.tap('.filtros button[data-f="prox"]'); await sleep(300);
  await p.screenshot({ path: O + 'd1-citas.png' });
  // confirmar (abre WhatsApp en otra pestaña)
  await p.tap('.cita .b-tq'); await p.waitForSelector('#hojaWA:not([hidden])');
  const waUrl = await p.getAttribute('#hojaWA a', 'href'); await p.screenshot({ path: O + 'd2-confirmada.png' }); await p.tap('#hojaWA .b-bor');
  await sleep(800); await p.screenshot({ path: O + 'd2-confirmada.png' });
  // terminado -> sello
  await p.tap('.cita .b-ok'); await sleep(1000);
  await sleep(8500); const s1 = await tarjeta.textContent('#tjCuenta');
  await tarjeta.screenshot({ path: O + 'c4-tarjeta1.png' });
  // escanear con la cámara
  await p.tap('.tabs button[data-sec="escanear"]'); await p.tap('#btnCam');
  await p.waitForSelector('#hallado .hallado', { timeout: 15000 });
  await p.screenshot({ path: O + 'd3-escaneo.png' });
  await p.tap('#hallado .b-ok'); await sleep(1200);
  await p.screenshot({ path: O + 'd4-sello-escaneo.png' });
  await sleep(8500); const s2 = await tarjeta.textContent('#tjCuenta');
  await tarjeta.screenshot({ path: O + 'c5-tarjeta2.png' });
  await p.tap('.tabs button[data-sec="clientes"]'); await sleep(300); await p.screenshot({ path: O + 'd5-clientes.png' });
  console.log(JSON.stringify({ fecha: f, enlace: enlace.slice(0, 30) + '…', horaOcupada: doble.filter((x) => !x.libre).map((x) => x.h), loginMalo: malMsg, wa: waUrl.slice(0, 60), trasTerminar: s1, trasEscanear: s2, errores: errs }, null, 1));
  await b1.close(); await b2.close();
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
