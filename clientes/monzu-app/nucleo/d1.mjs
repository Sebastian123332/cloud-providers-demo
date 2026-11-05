// Almacén para Cloudflare D1: escritura atómica con número de versión.
let tablaLista = false;
export function almacenD1(db) {
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

