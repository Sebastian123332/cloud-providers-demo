# Monzú Detallados: seguridad y privacidad

**Fecha de entrega:** 5 de noviembre de 2026
**Desarrollado por:** Solanotech

Este documento resume qué protege al sitio, qué se probó y qué le toca al dueño. Guárdelo como constancia de entrega.

---

## 1. Medidas de seguridad implementadas

### Conexión y página
- **HTTPS obligatorio** con certificado automático de Netlify, y HSTS (el navegador nunca usa conexión sin cifrar).
- **Política de seguridad de contenido (CSP)** estricta en cada página:
  - solo corre el código propio del sitio (con huella SHA-256),
  - nada de scripts externos, y Trusted Types activado contra inyección de código.
- **Sin terceros:** tipografías, imágenes y librerías se sirven desde el propio sitio. No hay Google Fonts, rastreadores, publicidad ni análisis.
- La página **no se puede incrustar en otro sitio** (anti clickjacking).
- Bloqueo de cámara, micrófono y ubicación en las páginas públicas. La cámara solo se permite en el panel, para escanear.
- El panel y las tarjetas no aparecen en Google (`noindex`, `robots.txt`).

### Datos de los clientes
- **PIN cifrado** con scrypt y sal única. Nadie puede leerlo, ni el dueño ni Solanotech.
- **Bloqueo por intentos:**
  - 5 PIN equivocados → ese teléfono se bloquea 15 minutos;
  - 8 contraseñas equivocadas del panel → esa conexión se bloquea 15 minutos.
  - El conteo se guarda en el servidor, así que vale aunque cambie de celular o pestaña.
- **Enlaces de tarjeta secretos** de 144 bits, imposibles de adivinar.
- Si alguien reserva con el teléfono de otra persona, la cita queda, pero **no ve la tarjeta de esa persona sin su PIN**.
- **La IP no se guarda**, solo una huella irreversible (hash) para frenar abusos.
- **Todo texto que se escribe se limpia:** se quitan `<` `>` y caracteres invisibles, y se muestra siempre como texto, nunca como código. Probado con ataques de inyección.
- **Precios calculados en el servidor** con la lista oficial: nadie puede mandar una cita con un precio falso.
- **Límites anti abuso:** máximo de reservas y registros por conexión y por día. Además hay una trampa contra robots en los formularios.

### Panel del dueño
- Requiere la contraseña `PANEL_CLAVE` (mínimo 10 caracteres). Sin ella, **el panel no funciona**.
- La contraseña **nunca se guarda en el celular**. Al entrar se recibe una **sesión firmada (HMAC) que vence**: 12 horas, o 30 días si se marca "Mantener la sesión".
- **"Cerrar sesión en todos los equipos"**, por si se pierde un celular.
- **Bitácora** de lo que se hace en el panel (entradas, sellos, canjes, citas, clientes eliminados), incluida en el respaldo.
- **Protección contra solicitudes de otros sitios (CSRF):** solo se aceptan pedidos que vengan del mismo sitio.

### Integridad de los datos
- **Escrituras atómicas:** si dos personas reservan la misma hora al mismo instante, solo una entra. Probado con 10 reservas simultáneas.
- **Respaldo descargable** desde el panel (Clientes → "Descargar respaldo"). No incluye PIN ni enlaces secretos.

### Privacidad (Ley 8968)
- Consentimiento explícito con casilla antes de guardar datos.
- Política de privacidad con:
  - responsable (Monzú) y encargado técnico (Solanotech),
  - qué datos se guardan y para qué,
  - transferencia al proveedor del servidor (Netlify, EE. UU.),
  - cuánto tiempo se guardan,
  - derechos de la persona.
- **Derecho de supresión:** el cliente puede **borrar su tarjeta y todos sus datos** con un botón (confirmando con su PIN). El dueño también puede eliminar clientes.
- Las citas se **borran solas a los 4 meses**.
- **Sin cookies.** El navegador solo guarda el enlace de la tarjeta (función necesaria, se explica en la política).

---

## 2. Pruebas realizadas (5 de noviembre de 2026)

| Prueba | Resultado |
|---|---|
| Pedido desde otro sitio (CSRF) | Rechazado (403) |
| Panel sin sesión, con sesión falsa o usando la contraseña como llave | Rechazado (401) |
| Fuerza bruta a la contraseña del panel | Bloqueado a los 8 intentos (429), aun con la clave correcta |
| 10 reservas simultáneas en la misma hora | Solo 1 aceptada |
| Inyección de código en nombre, nota, dirección y servicios | Neutralizada |
| Precio manipulado (₡1 por un Deluxe) | El servidor guardó el precio oficial (₡40.000) |
| Borrar la tarjeta de otro sin su PIN | Rechazado (401) |
| Sesiones viejas después de "Cerrar sesión en todos los equipos" | Rechazadas (401) |
| Respaldo | Sin PIN, sin sal y sin enlaces secretos |
| Peticiones a servidores externos al abrir las páginas | Ninguna |
| Violaciones de la política de seguridad (CSP) | Ninguna |

---

## 3. Lo que le toca al dueño (obligatorio)

1. **Contraseña del panel (`PANEL_CLAVE`):**
   - Mínimo 10 caracteres. Mejor tres palabras y un número, por ejemplo `Cartago-Espuma-Brillo-27` (no use este ejemplo).
   - No la comparta por WhatsApp ni la anote en papel a la vista.
2. **`SESION_SECRETO`:** un texto largo al azar (40 caracteres o más) en las variables de Netlify. Refuerza las sesiones.
3. **Verificación en dos pasos (2FA)** en las cuentas de **Netlify**, **Cloudflare** (dominio), **GitHub** y **el correo** con que se crearon.
4. **Descargar el respaldo cada semana** y guardarlo en un lugar seguro, como su Google Drive personal.
5. **Si pierde el celular:** entre al panel desde otro equipo y toque **"Cerrar sesión en todos los equipos"**. Si sospecha que alguien conoce la contraseña, cámbiela en Netlify (eso cierra todas las sesiones).
6. **Solicitudes de clientes** (ver, corregir o borrar sus datos): atenderlas en un máximo de **5 días hábiles**. El cliente también puede borrar todo desde su tarjeta.
7. **No pedir datos de más:** nada de cédulas, tarjetas de crédito ni contraseñas por la página.

---

## 4. Límites honestos (lo que ningún sitio puede garantizar)

- **No existe un sistema 100 % invulnerable.** Este sitio aplica las prácticas recomendadas (OWASP) y pasó las pruebas de arriba, pero la seguridad también depende de que las contraseñas y las cuentas se cuiden.
- **El servicio depende de proveedores externos** (Netlify, Cloudflare, WhatsApp) que pueden tener caídas fuera del control de Solanotech.
- **Los avisos de citas nuevas** llegan con el panel abierto o instalado. No sustituyen revisar el panel.
- **Registro ante la PRODHAB:** la Ley 8968 exige inscribir bases de datos que se usan para **distribuir, difundir o comercializar** datos. Esta base es de **uso interno** de Monzú, por lo que en principio no requiere inscripción. Si en el futuro se usa para publicidad masiva, compartirla o venderla, consulte con un abogado.
