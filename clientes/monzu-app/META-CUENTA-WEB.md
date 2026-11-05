# Cómo poner la web en Meta para que no le bajen la cuenta de WhatsApp API

Meta desactiva cuentas de WhatsApp Business API cuando no puede comprobar que el negocio es real. Lo primero que revisa es **un sitio web del negocio**. La página de Monzú ya tiene lo que Meta busca:

| Lo que pide Meta | Dónde está |
|---|---|
| Nombre del negocio igual al de la cuenta | "Monzú Detallados" en toda la página |
| Contacto: teléfono, zona, responsable | Sección Contacto y el recuadro de arriba de cada página legal |
| Política de privacidad (página propia) | **/privacidad** |
| Términos y condiciones | **/terminos** |
| Instrucciones para borrar los datos | **/eliminar-datos** |
| Permiso del cliente para recibir WhatsApp (*opt-in*) | La casilla al reservar: "…y a enviarme por WhatsApp la confirmación y los recordatorios de mis citas" |
| Conexión segura (HTTPS) | Sí |

> **Muy recomendado:** usar un **dominio propio**, por ejemplo `monzudetallados.com`.
> - Cuesta unos $10 al año en Cloudflare.
> - Meta confía mucho más en un dominio propio que en `…workers.dev`.
> - Con dominio propio también se puede **verificar el dominio**, lo que más ayuda a que no bajen la cuenta.
> - Además, el correo de la cuenta de Meta puede ser `contacto@monzudetallados.com`. El reenvío a Gmail es gratis con Cloudflare.

---

## Paso 1. Poner la web en la cuenta comercial
1. Vaya a **business.facebook.com → Configuración (⚙️) → Información de la empresa**.
2. Llene los datos así:
   - **Nombre legal:** igual a como aparece en la web, `Monzú Detallados`. Si está inscrito con otro nombre en Hacienda, use ese mismo en los dos lados.
   - **Sitio web:** `https://demomonzu.sebas43br.workers.dev`, o el dominio propio cuando lo tenga.
   - **Dirección:** Cartago, Costa Rica.
   - **Teléfono:** el del negocio.
3. Guarde.

## Paso 2. Poner las páginas legales en la app de Meta
1. Entre a **developers.facebook.com → Mis apps → la app → Configuración de la app → Básica**.
2. Llene los campos así:
   - **URL de la política de privacidad:** `https://demomonzu.sebas43br.workers.dev/privacidad`
   - **URL de las condiciones del servicio:** `https://demomonzu.sebas43br.workers.dev/terminos`
   - **URL de instrucciones para eliminar datos:** `https://demomonzu.sebas43br.workers.dev/eliminar-datos`
   - **Categoría:** Negocios y páginas.
   - **Ícono:** el logo de Monzú.
3. Guarde.
4. Ponga la app en modo **"Activo / En vivo"** (Live).

## Paso 3. Verificar el dominio (cuando tenga dominio propio)
1. Vaya a **business.facebook.com → Configuración → Seguridad de la marca → Dominios → Agregar** y escriba el dominio.
2. Escoja **"Etiqueta meta"** y copie solo el código que viene en `content="…"`.
3. Mándeselo a Claude. Él lo agrega a la página, la vuelve a publicar y usted toca **Verificar**.
   - Otra opción: escoger **Registro TXT de DNS** y pegarlo en Cloudflare → DNS. Así no hace falta que Claude toque la página.

## Paso 4. Verificar el negocio
1. Vaya a **Configuración → Centro de seguridad → Verificación del negocio → Empezar**.
2. Suba un documento que muestre el nombre del negocio y la dirección. Sirve, por ejemplo:
   - la constancia de inscripción en Hacienda (ATV),
   - un recibo de servicios a nombre del negocio,
   - la personería jurídica si es sociedad.
3. El nombre y el teléfono deben coincidir con los de la web.

## Paso 5. Pedir que le revisen la cuenta que se dio de baja
1. Entre a **business.facebook.com → Servicio de ayuda para empresas (Business Support Home)**, o vaya a **WhatsApp Manager → Información general de la cuenta**.
2. Toque la cuenta o el número restringido → **Solicitar revisión**.
3. En el texto, explique algo así:

   > "Somos Monzú Detallados, un servicio de detallado de vehículos a domicilio en Cartago, Costa Rica. Ya tenemos sitio web con nuestra información de contacto, política de privacidad, términos y eliminación de datos: https://demomonzu.sebas43br.workers.dev. Usamos WhatsApp solo para confirmar y recordar citas a clientes que agendaron y dieron su permiso en la web."

4. Espere la respuesta. Suele tardar de 24 a 48 horas.
   - Si no se puede reactivar, cree una cuenta de WhatsApp nueva en el mismo Business, ya con la web puesta.

## Para que no la vuelvan a bajar
- Mande **solo** mensajes a clientes que agendaron (recordatorios y confirmaciones). Nada de publicidad masiva.
- Use la plantilla en categoría **Utilidad**. Si la marca como Marketing, la revisan más y cuesta más.
- Si un cliente responde "NO", no le vuelva a escribir. Así lo dice /eliminar-datos.
- Al principio Meta deja escribir a pocos números por día. El límite sube solo si los clientes no bloquean ni reportan el número.
