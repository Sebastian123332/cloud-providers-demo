# Monzú en Cloudflare Pages (gratis)

La misma app de Netlify (página, reservas, Monzú Club, panel y todas las medidas de seguridad), funcionando en Cloudflare:
- **Cloudflare Pages:** la página y el servidor (Pages Functions).
- **Cloudflare D1:** la base de datos.

Se probó con el motor real de Cloudflare (`wrangler pages dev`): reservas, PIN, panel, escaneo con cámara, ataques y cabeceras de seguridad, todo bien.

---

## Paso 1. Crear la base de datos (2 minutos)
1. Entre a **dash.cloudflare.com**.
2. En el menú, vaya a **Storage & Databases → D1 SQL Database → Create** (Crear).
3. **Name:** `monzu`. Lo demás déjelo como está y toque **Create**.
4. Copie el **Database ID**, un código largo tipo `a1b2c3d4-…`, y **mándeselo a Claude**. Él lo pone en `wrangler.toml` y lo sube.

La tabla se crea sola la primera vez que alguien usa la página.

## Paso 2. Crear el sitio desde GitHub (después de que Claude suba el ID)
1. Vaya a **Workers & Pages → Create → pestaña Pages → Import an existing Git repository** (o "Connect to Git").
2. Escoja **GitHub** → el repositorio **cloud-providers-demo**.
3. Configure:
   - **Production branch:** `claude/nueva-pagina-web-5qmclp`
   - **Framework preset:** None
   - **Build command:** déjelo vacío
   - **Build output directory:** `public`
   - **Root directory (advanced):** `clientes/monzu-app`
4. Toque **Save and Deploy**. Queda en `https://monzu-detallados.pages.dev`, o con el nombre que Cloudflare le dé.

## Paso 3. Contraseñas (obligatorio)
1. En el sitio: **Settings → Variables and Secrets → Add**.
2. Agregue dos variables, las dos de tipo **Secret** y en **Production**:
   - `PANEL_CLAVE`: la contraseña del panel, mínimo 10 caracteres.
   - `SESION_SECRETO`: un texto largo al azar, de 40 caracteres o más.
3. Vaya a **Deployments → los tres puntitos del último → Retry deployment**. Las variables valen desde ese despliegue.

## Paso 4. Probar
- `https://SU-SITIO.pages.dev/api/horarios?fecha=2026-12-01` → debe salir `{"ok":true,…}`.
- `https://SU-SITIO.pages.dev/panel` → entra con la `PANEL_CLAVE`.

## Paso 5. Dominio propio (si ya está en Cloudflare)
1. En el sitio: **Custom domains → Set up a custom domain** → escriba el dominio (por ejemplo `monzudetallados.com`) → **Continue → Activate domain**.
2. Como el dominio ya está en Cloudflare, el DNS y el candado HTTPS se configuran solos.
3. Pásele el dominio a Claude, que actualiza la página para Google y WhatsApp.

## Paso 6. Apagar Netlify (para que no siga gastando créditos)
En Netlify → monzu-detallados → **Project configuration → Build & deploy → Continuous deployment → Stop builds**. Cuando Cloudflare ya funcione, puede borrar ese proyecto de Netlify.

---

**Límites del plan gratis de Cloudflare:**
- 100 000 visitas al servidor por día.
- D1 con 5 millones de lecturas y 100 000 escrituras por día.
- 500 publicaciones al mes.

Para Monzú sobra muchísimo.
