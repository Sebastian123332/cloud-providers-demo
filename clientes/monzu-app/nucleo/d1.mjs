// Almacén para Cloudflare D1: escritura atómica con número de versión.
// Los datos se guardan comprimidos (gzip) para que quepan muchos más clientes en la fila de 2 MB de D1.
import { Buffer } from 'node:buffer';
let tablaLista = false;
async function gzip(txt) { return new Uint8Array(await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); }
async function gunzip(b) { return await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); }
export async function empaca(v) { const txt = JSON.stringify(v); return txt.length < 4000 ? txt : 'gz:' + Buffer.from(await gzip(txt)).toString('base64'); }
export async function desempaca(s) { return JSON.parse(s.startsWith('gz:') ? await gunzip(Buffer.from(s.slice(3), 'base64')) : s); }
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
      return r ? { data: await desempaca(r.v), etag: String(r.ver), bytes: r.v.length } : null;
    },
    escribir: async (k, v, etag) => {
      await prepara();
      const txt = await empaca(v);
      if (txt.length > 1900000) throw new Error('La base de datos está llena: hay que ampliarla.');
      const r = etag
        ? await db.prepare('UPDATE kv SET v = ?1, ver = ver + 1 WHERE k = ?2 AND ver = ?3').bind(txt, k, Number(etag)).run()
        : await db.prepare('INSERT INTO kv (k, v, ver) VALUES (?1, ?2, 1) ON CONFLICT(k) DO NOTHING').bind(k, txt).run();
      return r.meta.changes === 1;
    },
  };
}
