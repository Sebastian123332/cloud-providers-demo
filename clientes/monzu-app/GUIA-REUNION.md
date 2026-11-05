# Monzú Detallados: página + reservas + Monzú Club + panel del dueño

Guía para publicar la app y para la reunión con el dueño de Monzú (Isaac Monge).

**Qué incluye**
- **Página** con reservas reales. El cliente elige la fecha y ve solo las horas libres; una hora reservada ya no la puede tomar otro.
- **Tarjeta Monzú Club** (`/tarjeta.html`). Se crea sola con la primera cita y se guarda en la pantalla de inicio del celular. Muestra los sellos y se actualiza sola.
- **Panel del dueño** (`/panel.html`), con contraseña:
  - citas de hoy y próximas,
  - confirmar (abre WhatsApp con el mensaje listo),
  - "Terminado: dar sello",
  - escanear el QR de la tarjeta con la cámara,
  - lista de clientes,
  - canjear el premio,
  - aviso de citas nuevas.
- **Costo:** ₡0 al mes (Netlify gratis: Functions + Blobs). Solo el dominio, si se compra (~US$11 al año).

---

## Cómo se registra cada cliente (web pública)

**El usuario es su número de teléfono y la clave es un PIN de 4 números que él mismo escoge.**

| Cómo llega el cliente | Qué pasa |
|---|---|
| **Se registra solo**: página → "Monzú Club" → **Unirme gratis** | Pone nombre, teléfono, carro y su PIN. Se le crea la tarjeta al instante. |
| **Reserva en la página** | El formulario le pide un PIN. Si es nuevo, se le crea la tarjeta; si ya es miembro y pone su PIN, la cita se conecta con su tarjeta. |
| **Llega sin reservar** (WhatsApp o en la calle) | El dueño, en el panel → Clientes → **"Nuevo cliente"**, pone nombre y teléfono, y le manda la tarjeta por WhatsApp. El cliente la abre y crea su PIN. |

- **Entrar desde cualquier celular:** página → **"Mi tarjeta"** → **"Ya soy miembro"** → teléfono + PIN.
- **¿Olvidó el PIN?** Le escribe al dueño, que toca **"Restablecer PIN"** en el panel. Le llega su tarjeta por WhatsApp para crear uno nuevo.
- **Seguridad:**
  - El PIN se guarda cifrado; ni el dueño lo puede ver.
  - Después de 5 intentos malos, ese teléfono se bloquea 15 minutos.
  - Si alguien reserva con el teléfono de otra persona, la cita queda, pero **no ve la tarjeta de esa persona**.

---

## 1. Publicarlo (una sola vez, unos 10 minutos)

Esta app tiene un pequeño servidor (las reservas y los sellos se guardan), así que **no se sube arrastrando un zip**: se conecta al repositorio de GitHub. La ventaja es que cada vez que se hace un cambio, Netlify la actualiza sola.

1. Entre a **app.netlify.com** → **Add new site** → **Import an existing project** → **GitHub**, y autorice si lo pide.
2. Elija el repositorio **sebastian123332/cloud-providers-demo**.
3. Configure:
   - **Branch to deploy:** `claude/nueva-pagina-web-5qmclp`
   - **Base directory:** `clientes/monzu-app`
   - Lo demás (Publish `public`, Functions `netlify/functions`) se llena solo con el `netlify.toml`.
4. Toque **Deploy** y espere 1 o 2 minutos.
5. **Site configuration → Change site name** → por ejemplo `monzu-detallados`. Queda `https://monzu-detallados.netlify.app`.
6. **Contraseña del panel:** en **Site configuration → Environment variables** agregue `PANEL_CLAVE` con la contraseña que quiera el dueño. Después vaya a **Deploys → Trigger deploy**.
   - **Es obligatoria:** mínimo 10 caracteres. Sin ella el panel no abre. Agregue también `SESION_SECRETO` con un texto largo al azar. Detalles en **SEGURIDAD.md**.

**Revisar que quedó bien:** abra `https://SU-SITIO.netlify.app/api/horarios?fecha=2026-12-01`. Tiene que salir un texto con `"ok":true` y las horas.

---

## 2. Antes de la reunión (5 minutos)

- **Su celular hace de cliente.** Abra la página, reserve una cita para mañana y toque **"Ver mi tarjeta Monzú Club"**. Después **guárdela en la pantalla de inicio**:
  - **iPhone:** Safari → Compartir → "Agregar a pantalla de inicio".
  - **Android:** Chrome → ⋮ → "Agregar a pantalla principal".
- **El panel:** ábralo en la compu o en un segundo celular: `SU-SITIO.netlify.app/panel.html`, con la contraseña `PANEL_CLAVE`.
- **Para enseñar el premio:** en el panel → **Clientes** → a su nombre de prueba **"Dar sello"** hasta dejarlo en **9/10**.

---

## 3. Guion de la reunión (15 minutos)

1. **La página.** Enséñele la sección **Monzú Club** ("Cada lavado suma") y **Agendar**. Al elegir la fecha salen las horas libres; la hora que usted reservó sale **"Ocupada"**.
2. **Él reserva.** Que el dueño reserve una cita desde **su** celular, con su nombre. En el panel, a los pocos segundos, aparece la **cita nueva** (con aviso). Toque **"Confirmar"**: se abre WhatsApp con la confirmación y **el enlace de su tarjeta**.
3. **Su tarjeta.** El dueño abre el enlace y ve su tarjeta en 0/10. Que la guarde en su pantalla de inicio: queda como app con el logo de Monzú.
4. **Escanear (lo más importante).**
   - Entre al panel **en el celular del dueño** (`/panel.html`, con la contraseña del panel) y ábralo en **Escanear**.
   - Usted abre su tarjeta en su celular. Él toca **"Escanear tarjeta del cliente"** y apunta la cámara a su código QR.
   - Le sale su nombre y sus sellos. Toca **"Dar sello"**.
   - **En su celular, la tarjeta se actualiza sola en unos segundos**, con aviso de "¡Sello agregado!".
5. **El premio.** Como su tarjeta estaba en 9, ahora queda en **10/10 dorada: "¡Lavado gratis!"**. En el panel sale **"Canjear lavado gratis"**; al tocarlo, la tarjeta vuelve a 0.
6. **Día a día con citas.** En **Citas**, cuando termina un lavado toca **"Terminado: dar sello"**: no hace falta escanear.
7. **Clientes.** Ve a todos, cuántos sellos llevan, quién está cerca del premio, y puede **reenviar la tarjeta por WhatsApp** a quien la perdió.
8. **El panel como app.** Que lo guarde en su pantalla de inicio y toque la **campana** para activar los avisos de citas nuevas.

---

## 4. Preguntas que puede hacer el dueño

| Pregunta | Respuesta |
|---|---|
| ¿Cuánto cuesta al mes? | ₡0. Netlify es gratis para un negocio de este tamaño. Solo el dominio, si quiere uno propio (~US$11 al año). |
| ¿Y Apple Wallet? | Exige pagarle a Apple US$99 al año. Esta tarjeta hace lo mismo gratis y sirve en iPhone y Android. Google Wallet se puede agregar después, también gratis. |
| ¿El cliente se puede poner sellos solo? | No. Solo el panel con contraseña pone sellos. Cada tarjeta tiene un enlace secreto imposible de adivinar. |
| ¿Si el cliente cambia de celular? | No pierde nada: los sellos están en el servidor. Desde **Clientes → Enviar tarjeta** se le reenvía el enlace. |
| ¿Dos clientes pueden reservar la misma hora? | No. Cuando alguien reserva, esa hora se bloquea. Si el dueño cancela, se libera. |
| ¿Cómo me entero de una cita nueva? | Con el panel abierto o instalado, avisa (campana). Además el cliente puede mandar también el WhatsApp desde la página. |
| ¿Puedo cambiar horas, días, sellos o premio? | Sí, se ajusta en minutos (vea la sección 5). |

---

## 5. Ajustes actuales (se cambian en `netlify/functions/api.mjs`, en `AJUSTES`)

- **Turnos:** 8:00 a. m., 10:00 a. m., 1:00 p. m. y 3:00 p. m., un carro por turno.
- **Días:** lunes a sábado. Se reserva hasta 45 días adelante.
- **Premio:** 10 sellos = Lavado Premium gratis.

## 6. Antes de usarlo con clientes de verdad

1. Poner `PANEL_CLAVE` y `SESION_SECRETO` (paso 1.6) y activar la verificación en dos pasos en Netlify, Cloudflare, GitHub y el correo.
2. **Borrar los datos de prueba de la reunión:** Netlify → el sitio → **Blobs** → store `monzu` → borrar `db`.
3. Quitar la barra "Versión de prueba". Me avisa y la quito.
4. Conectar su dominio, igual que con Grúas Hidalgo.

**Limitación honesta:** los avisos de citas nuevas llegan mientras el panel está abierto o instalado en el celular. Si más adelante quiere que le llegue un correo o un aviso con el panel cerrado, se agrega (también gratis).
