// Servidor local de prueba: sirve public/ y pasa /api/* a la función de Netlify.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const RAIZ = '/home/user/cloud-providers-demo/clientes/monzu-app';
process.env.MONZU_LOCAL_DB = process.env.MONZU_LOCAL_DB || path.join(path.dirname(new URL(import.meta.url).pathname), 'datos-local.json');
const { default: api } = await import(RAIZ + '/netlify/functions/api.mjs');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const PUERTO = +(process.env.PORT || 8790);
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:' + PUERTO);
  if (u.pathname.startsWith('/api/')) {
    const trozos = []; for await (const c of req) trozos.push(c);
    const r = new Request(u, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(trozos) : undefined });
    const out = await api(r, { ip: req.socket.remoteAddress });
    res.writeHead(out.status, Object.fromEntries(out.headers)); res.end(Buffer.from(await out.arrayBuffer())); return;
  }
  let f = path.join(RAIZ, 'public', u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
  if (!f.startsWith(path.join(RAIZ, 'public')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(PUERTO, () => console.log('listo en http://localhost:' + PUERTO));
