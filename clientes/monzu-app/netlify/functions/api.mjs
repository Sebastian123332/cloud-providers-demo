// Adaptador Netlify: Netlify Functions + Netlify Blobs (escritura atómica con etag).
import { manejar } from '../../nucleo/api.mjs';
import { createHash } from 'node:crypto';

export const config = { path: '/api/*' };

async function almacenNetlify() {
  const { getStore } = await import('@netlify/blobs');
  const s = getStore({ name: 'monzu', consistency: 'strong' });
  return {
    leer: (k) => s.getWithMetadata(k, { type: 'json' }),
    escribir: async (k, v, etag) => (await s.setJSON(k, v, etag ? { onlyIfMatch: etag } : { onlyIfNew: true })).modified,
  };
}
async function almacenLocal(ruta) {                       // solo para pruebas locales
  const fs = await import('node:fs');
  const f = (k) => ruta.replace(/\.json$/, '') + '-' + k + '.json';
  const h = (s) => createHash('sha1').update(s).digest('hex');
  return {
    leer: async (k) => { if (!fs.existsSync(f(k))) return null; const s = fs.readFileSync(f(k), 'utf8'); return { data: JSON.parse(s), etag: h(s) }; },
    escribir: async (k, v, etag) => {
      const actual = fs.existsSync(f(k)) ? h(fs.readFileSync(f(k), 'utf8')) : null;
      if ((etag || null) !== actual) return false;
      fs.writeFileSync(f(k), JSON.stringify(v)); return true;
    },
  };
}
export default async (req, context) => manejar(req, {
  ip: context?.ip || req.headers.get('x-nf-client-connection-ip') || 'local',
  env: process.env,
  almacen: process.env.MONZU_LOCAL_DB ? await almacenLocal(process.env.MONZU_LOCAL_DB) : await almacenNetlify(),
});
