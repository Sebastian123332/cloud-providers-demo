#!/bin/bash
# reinicia Cloudflare local con base de datos limpia y corre una prueba
S=/tmp/claude-0/-home-user-cloud-providers-demo/85d304cc-16a2-5927-a034-75b90352da3b/scratchpad
cd /home/user/cloud-providers-demo/clientes/monzu-app
pkill -f "wrangler pages dev" ; pkill -f workerd ; sleep 1
rm -rf .wrangler/state
WRANGLER_SEND_METRICS=false timeout 900 $S/cf-tools/node_modules/.bin/wrangler pages dev --port 8788 --ip 127.0.0.1 > $S/wrangler.log 2>&1 &
for i in $(seq 1 40); do sleep 1; curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8788/ 2>/dev/null | grep -q 200 && break; done
cd $S/monzu-app-test/cf && CLAVE='MonzuPrueba2026' node "$1"
