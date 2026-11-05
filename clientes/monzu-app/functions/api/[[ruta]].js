// Adaptador Cloudflare Pages: Pages Functions + base de datos D1 (escritura atómica con número de versión).
import { manejar } from '../../nucleo/api.mjs';

let tablaLista = false;
function almacenD1(db) {
  async function prepara() {
    if (tablaLista) return;
    await db.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, ver INTEGER NOT NULL)').run();
    tablaLista = true;
  }
  return {
    leer: async (k) => {
      await prepara();
      const r = await db.prepare('SELECT v, ver FROM kv WHERE k = ?1').bind(k).first();
      return r ? { data: JSON.parse(r.v), etag: String(r.ver) } : null;
    },
    escribir: async (k, v, etag) => {
      await prepara();
      const txt = JSON.stringify(v);
      const r = etag
        ? await db.prepare('UPDATE kv SET v = ?1, ver = ver + 1 WHERE k = ?2 AND ver = ?3').bind(txt, k, Number(etag)).run()
        : await db.prepare('INSERT INTO kv (k, v, ver) VALUES (?1, ?2, 1) ON CONFLICT(k) DO NOTHING').bind(k, txt).run();
      return r.meta.changes === 1;
    },
  };
}

export async function onRequest({ request, env }) {
  if (!env.DB) return new Response(JSON.stringify({ ok: false, error: 'Falta conectar la base de datos D1 (enlace DB).' }), { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  return manejar(request, { ip: request.headers.get('cf-connecting-ip') || 'local', env, almacen: almacenD1(env.DB) });
}
