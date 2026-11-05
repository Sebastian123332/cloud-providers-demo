// Monzú Club: recibe los recordatorios de cita (Web Push) y los muestra como notificación.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(String(d.title || 'Monzú Detallados').slice(0, 60), {
    body: String(d.body || 'Tiene una cita con Monzú.').slice(0, 300),
    icon: '/icono-192.png', badge: '/icono-192.png', tag: 'monzu-cita', renotify: true, data: { url: '/tarjeta.html' },
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) if (lista[i].url.indexOf('/tarjeta') !== -1 && 'focus' in lista[i]) return lista[i].focus();
    return self.clients.openWindow('/tarjeta.html');
  }));
});
