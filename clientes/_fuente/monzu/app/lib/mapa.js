/* Mapa liviano para marcar la ubicación (OpenStreetMap, sin librerías ni llaves).
   La flecha queda fija en el centro y el cliente mueve el mapa debajo, como en las apps de transporte.
   Uso: MonzuMapa(caja, { lat, lng, alCambiar(fn({lat,lng})) }) -> { pon(lat,lng), miUbicacion() } */
(function () {
  'use strict';
  var T = 256, NS = 'http://www.w3.org/2000/svg';
  function aPx(lat, lng, z) { var n = T * Math.pow(2, z), s = Math.sin(lat * Math.PI / 180); return { x: (lng + 180) / 360 * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n }; }
  function aGeo(x, y, z) { var n = T * Math.pow(2, z), lng = x / n * 360 - 180, k = Math.PI - 2 * Math.PI * y / n; return { lat: 180 / Math.PI * Math.atan(Math.sinh(k)), lng: lng }; }
  function el(tag, css, padre) { var e = document.createElement(tag); for (var k in css) e.style[k] = css[k]; if (padre) padre.appendChild(e); return e; }
  function boton(txt, titulo, padre, css) { var b = el('button', Object.assign({ width: '40px', height: '40px', borderRadius: '10px', border: '0', background: '#fff', color: '#07141A', font: '700 20px system-ui', boxShadow: '0 2px 8px rgba(0,0,0,.35)', cursor: 'pointer' }, css || {}), padre); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', titulo); return b; }

  window.MonzuMapa = function (caja, op) {
    op = op || {};
    var z = 16, c = aPx(op.lat || 9.8644, op.lng || -83.9194, z), cache = {};
    caja.textContent = '';
    var marco = el('div', { position: 'relative', height: '260px', borderRadius: '16px', overflow: 'hidden', background: '#dfe6e9', touchAction: 'none', cursor: 'grab', userSelect: 'none' }, caja);
    marco.setAttribute('role', 'application'); marco.setAttribute('aria-label', 'Mapa: mueva el mapa hasta que la flecha quede en su ubicación');
    var capa = el('div', { position: 'absolute', left: '0', top: '0' }, marco);
    // flecha (pin) fija en el centro
    var pin = document.createElementNS(NS, 'svg'); pin.setAttribute('viewBox', '0 0 40 52'); pin.setAttribute('aria-hidden', 'true');
    pin.style.position = 'absolute'; pin.style.left = '50%'; pin.style.top = '50%'; pin.style.width = '40px'; pin.style.height = '52px'; pin.style.transform = 'translate(-50%,-100%)'; pin.style.pointerEvents = 'none'; pin.style.filter = 'drop-shadow(0 4px 4px rgba(0,0,0,.4))';
    var p1 = document.createElementNS(NS, 'path'); p1.setAttribute('d', 'M20 1C9.5 1 1 9.3 1 19.6 1 33 20 51 20 51s19-18 19-31.4C39 9.3 30.5 1 20 1z'); p1.setAttribute('fill', '#E53935'); p1.setAttribute('stroke', '#fff'); p1.setAttribute('stroke-width', '2'); pin.appendChild(p1);
    var p2 = document.createElementNS(NS, 'circle'); p2.setAttribute('cx', '20'); p2.setAttribute('cy', '19'); p2.setAttribute('r', '7'); p2.setAttribute('fill', '#fff'); pin.appendChild(p2);
    marco.appendChild(pin);
    var punto = el('div', { position: 'absolute', left: '50%', top: '50%', width: '8px', height: '8px', margin: '-4px 0 0 -4px', borderRadius: '50%', background: '#07141A', pointerEvents: 'none' }, marco);
    var zonas = el('div', { position: 'absolute', right: '10px', top: '10px', display: 'grid', gap: '8px' }, marco);
    var mas = boton('+', 'Acercar', zonas), menos = boton('−', 'Alejar', zonas);
    var atrib = el('a', { position: 'absolute', right: '4px', bottom: '4px', background: 'rgba(255,255,255,.85)', color: '#333', font: '11px system-ui', padding: '1px 5px', borderRadius: '4px', textDecoration: 'none' }, marco);
    atrib.href = 'https://www.openstreetmap.org/copyright'; atrib.target = '_blank'; atrib.rel = 'noopener noreferrer'; atrib.textContent = '© OpenStreetMap';

    function pinta() {
      var w = marco.clientWidth, h = marco.clientHeight, x0 = c.x - w / 2, y0 = c.y - h / 2, n = Math.pow(2, z), vivos = {};
      for (var tx = Math.floor(x0 / T); tx <= Math.floor((x0 + w) / T); tx++) for (var ty = Math.floor(y0 / T); ty <= Math.floor((y0 + h) / T); ty++) {
        if (ty < 0 || ty >= n) continue;
        var cl = z + '/' + ((tx % n) + n) % n + '/' + ty, im = cache[cl];
        if (!im) { im = el('img', { position: 'absolute', width: T + 'px', height: T + 'px', maxWidth: 'none' }, capa); im.alt = ''; im.draggable = false; im.decoding = 'async'; im.referrerPolicy = 'strict-origin-when-cross-origin'; im.onerror = function () { this.style.visibility = 'hidden'; }; im.src = 'https://tile.openstreetmap.org/' + cl + '.png'; cache[cl] = im; }
        im.style.transform = 'translate(' + Math.round(tx * T - x0) + 'px,' + Math.round(ty * T - y0) + 'px)'; vivos[cl] = 1;
      }
      for (var q in cache) if (!vivos[q]) { cache[q].remove(); delete cache[q]; }
    }
    function avisa() { if (op.alCambiar) { var g = aGeo(c.x, c.y, z); op.alCambiar({ lat: +g.lat.toFixed(5), lng: +g.lng.toFixed(5) }); } }
    function zoom(d) { var g = aGeo(c.x, c.y, z); z = Math.max(8, Math.min(19, z + d)); c = aPx(g.lat, g.lng, z); for (var q in cache) { cache[q].remove(); delete cache[q]; } pinta(); }
    mas.addEventListener('click', function () { zoom(1); }); menos.addEventListener('click', function () { zoom(-1); });
    // arrastrar con dedo o mouse; dos dedos = acercar/alejar
    var dedos = {}, ult = null, dist0 = 0;
    function centro() { var ks = Object.keys(dedos), sx = 0, sy = 0; ks.forEach(function (k) { sx += dedos[k].x; sy += dedos[k].y; }); return { x: sx / ks.length, y: sy / ks.length, n: ks.length }; }
    function separa() { var v = Object.values(dedos); return v.length < 2 ? 0 : Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y); }
    marco.addEventListener('pointerdown', function (e) { if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return; marco.setPointerCapture(e.pointerId); dedos[e.pointerId] = { x: e.clientX, y: e.clientY }; ult = centro(); dist0 = separa(); marco.style.cursor = 'grabbing'; });
    marco.addEventListener('pointermove', function (e) {
      if (!dedos[e.pointerId]) return; dedos[e.pointerId] = { x: e.clientX, y: e.clientY };
      var k = centro(); if (ult && k.n === ult.n) { c.x -= k.x - ult.x; c.y -= k.y - ult.y; pinta(); } ult = k;
      if (k.n === 2 && dist0) { var dd = separa(); if (dd / dist0 > 1.6) { zoom(1); dist0 = dd; } else if (dd / dist0 < 0.6) { zoom(-1); dist0 = dd; } }
    });
    function suelta(e) { if (!dedos[e.pointerId]) return; delete dedos[e.pointerId]; ult = Object.keys(dedos).length ? centro() : null; marco.style.cursor = 'grab'; if (!ult) avisa(); }
    marco.addEventListener('pointerup', suelta); marco.addEventListener('pointercancel', suelta);
    marco.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); avisa(); }, { passive: false });
    if (window.ResizeObserver) new ResizeObserver(pinta).observe(marco);
    pinta();
    var api = {
      pon: function (lat, lng) { c = aPx(lat, lng, z); pinta(); avisa(); },
      miUbicacion: function (alError) {
        if (!navigator.geolocation) { if (alError) alError('Este celular no permite ubicar.'); return; }
        navigator.geolocation.getCurrentPosition(function (p) { if (z < 17) { z = 17; for (var q in cache) { cache[q].remove(); delete cache[q]; } } api.pon(p.coords.latitude, p.coords.longitude); },
          function (er) { if (alError) alError(er && er.code === 1 ? 'No dio permiso para usar su ubicación. Mueva el mapa a mano o permita la ubicación en el navegador.' : 'No se pudo obtener su ubicación. Mueva el mapa a mano.'); },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
      },
    };
    return api;
  };
})();
