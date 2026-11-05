# Monzú en Cloudflare (Worker `demomonzu`), gratis

La app completa (página, reservas, Monzú Club, panel y toda la seguridad) corre como un **Worker** de Cloudflare:
- **`public/`:** la página.
- **`worker/index.js`:** el servidor (`/api`).
- **D1:** la base de datos, que **se crea sola** al publicar.

Se probó con el motor real de Cloudflare (`wrangler dev`):
- reservas y PIN,
- panel y escaneo con cámara,
- precios calculados en el servidor,
- ataques de seguridad bloqueados y cabeceras de seguridad activas.

---

## Paso 1. Conectar el Worker con GitHub (una sola vez)
1. Cloudflare → **Trabajadores y Pages** → **demomonzu**.
2. En "Próximos pasos" toque **"Automatice su CI → Conecta tu repositorio Git"**. También está en **Ajustes → Compilación (Build) → Conectar**.
3. Escoja **GitHub** y autorice si lo pide → repositorio **cloud-providers-demo**.
4. Configure:
   - **Rama (Branch):** `claude/nueva-pagina-web-5qmclp`
   - **Ruta raíz / Directorio raíz (Root directory / Path):** `clientes/monzu-app`
   - **Comando de compilación (Build command):** vacío
   - **Comando de implementación (Deploy command):** `npx wrangler deploy` (normalmente ya viene así)
5. **Conectar / Guardar**. Cloudflare publica solo y crea la base de datos `monzu`. Tarda 1 o 2 minutos.

Desde ahí, **cada cambio que Claude suba a GitHub se publica solo**, sin gastar nada.

## Paso 2. Contraseñas del panel (obligatorio)
1. **demomonzu → Ajustes → Variables y secretos → Agregar**.
2. Agregue dos, las dos de **Tipo: Secreto**:
   - `PANEL_CLAVE`: la contraseña del dueño, mínimo 10 caracteres.
   - `SESION_SECRETO`: cualquier texto largo al azar, de 40 caracteres o más.
3. **Implementar / Guardar.**

## Paso 3. Entrar
| Qué | Dirección |
|---|---|
| Página | https://demomonzu.sebas43br.workers.dev |
| Panel del dueño | https://demomonzu.sebas43br.workers.dev/panel (con la `PANEL_CLAVE`) |
| Tarjeta de clientes | https://demomonzu.sebas43br.workers.dev/tarjeta |
| Prueba del servidor | https://demomonzu.sebas43br.workers.dev/api/horarios?fecha=2026-12-01 → debe decir `"ok":true` |

## Paso 4. Dominio propio (cuando lo tenga en Cloudflare)
1. **demomonzu → Dominios → Agregar dominio personalizado** → escriba el dominio. El DNS y el candado se ponen solos.
2. Páseselo a Claude para actualizar Google y WhatsApp.

---

**Si la publicación falla** diciendo algo de permisos de D1:
1. Cree la base a mano: **Almacenamiento y bases de datos → D1 → Crear → nombre `monzu`**.
2. Mándele el **ID** a Claude, que lo agrega al `wrangler.toml`.

**Límites gratis:**
- 100 000 visitas al servidor por día.
- D1 con 5 millones de lecturas y 100 000 escrituras por día.

Para Monzú sobra.
