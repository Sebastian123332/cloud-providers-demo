// Adaptador Cloudflare Pages (alternativo): Pages Functions + D1. El despliegue recomendado es el Worker (worker/index.js).
import { manejar } from '../../nucleo/api.mjs';
import { almacenD1 } from '../../nucleo/d1.mjs';

export async function onRequest({ request, env }) {
  if (!env.DB) return new Response(JSON.stringify({ ok: false, error: 'Falta la base de datos D1 (enlace DB).' }), { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  return manejar(request, { ip: request.headers.get('cf-connecting-ip') || 'local', env, almacen: almacenD1(env.DB) });
}
