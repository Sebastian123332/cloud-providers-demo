// Worker de Cloudflare para Monzú: /api/* lo atiende el servidor; todo lo demás son los archivos de la página (public/).
import { manejar, recordar } from '../nucleo/api.mjs';
import { almacenD1 } from '../nucleo/d1.mjs';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (!env.DB) return new Response(JSON.stringify({ ok: false, error: 'Falta la base de datos D1 (enlace DB).' }), { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      return manejar(request, { ip: request.headers.get('cf-connecting-ip') || 'local', env, almacen: almacenD1(env.DB) });
    }
    return env.ASSETS.fetch(request);
  },
  // Cada 10 minutos: manda los recordatorios de 24 h y 1 h antes de cada cita.
  async scheduled(evento, env, ctx) {
    if (env.DB) ctx.waitUntil(recordar({ env, almacen: almacenD1(env.DB) }));
  },
};
