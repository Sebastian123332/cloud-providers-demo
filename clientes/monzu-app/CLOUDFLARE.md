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

Conectar el repositorio **no publica nada por sí solo**: Cloudflare compila cuando llega un cambio nuevo a la rama. Si después de conectar no aparece ninguna compilación, pídale a Claude que suba un cambio, o use **Despliegues → Nuevo despliegue**.

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

---

## Recordatorios, multa y pagos (nuevo)
- **Recordatorios automáticos:**
  - El Worker revisa las citas cada 10 minutos (está en `wrangler.toml`, en `[triggers]`).
  - Al cliente que activó "🔔 Recordatorios" en su tarjeta le llega una notificación 24 horas antes y otra 1 hora antes.
  - No cuesta nada ni hay que configurar nada.
  - Los clientes que no los activaron aparecen arriba en el panel, en **Citas**, con un botón **Recordar** por WhatsApp.
  - En iPhone el cliente primero guarda la tarjeta en la pantalla de inicio y la abre desde el ícono.
- **Multa de ₡5.000:**
  - En el panel, el botón **No llegó (multa)** aparece cuando ya pasó la hora de la cita.
  - La multa sale sola en la siguiente reserva del cliente.
  - Se puede quitar con **Anular multa** en Clientes.
- **Pagos:** el cliente escoge entre efectivo, SINPE Móvil o transferencia. En el panel se marca **Pagado**.
- **Pasar clientes de otro sistema:**
  - Panel → **Clientes** → **Pasar mis clientes de otro sistema**.
  - Pegue un cliente por línea: `Nombre, Teléfono, Carro, Sellos`.
- **Desde la tarjeta, el cliente puede:**
  - reservar rápido,
  - cambiar la fecha u hora,
  - cancelar hasta 2 horas antes,
  - marcar su ubicación en el mapa. El panel la abre en Google Maps o Waze.
