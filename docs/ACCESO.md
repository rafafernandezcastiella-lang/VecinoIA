# Identificación y permisos — primera implementación

Implementado y validado el 13 de octubre de 2026. Todas las cuentas y claves de este documento son públicas, ficticias y exclusivas de la demo.

| Usuario | Contraseña ficticia | Perfil | Comunidades |
|---|---|---|---|
| vecino.olivos | Olivos-Demo-2026! | Vecino | Los Olivos |
| vecino.olivos2 | Olivos2-Demo-2026! | Otro vecino | Los Olivos |
| vecino.plaza | Plaza-Demo-2026! | Vecina | Plaza Mayor |
| administrador | Admin-Demo-2026! | Administrador | Ambas |
| admin.olivos | AdminOlivos-Demo-2026! | Administrador | Los Olivos |
| gestion | Gestion-Demo-2026! | Gestión VecinoIA | Ambas |

Las claves también aparecen en la sección desplegable de la pantalla de acceso para facilitar la revisión del jurado.

## Comportamiento

- La sesión determina el rol y las comunidades; se elimina el selector libre de perfiles.
- El servidor rechaza las solicitudes sin identificación o dirigidas a una comunidad no autorizada.
- El vecino ve únicamente las consultas cuyo autor es su cuenta.
- Administradores y gestión pueden atender consultas y publicar avisos dentro de sus comunidades asignadas.
- El autor de una consulta se toma de la sesión; el cliente no puede suplantar otro vecino mediante campos del formulario o de la API.
- Cierre de sesión con revocación inmediata; sesión válida durante ocho horas y conservada al recargar.
- Reiniciar el servidor invalida las sesiones y requiere volver a identificarse; las cuentas y consultas permanecen.
- Las consultas anteriores sin autor identificable se conservan para administración y no se atribuyen a ningún vecino.

## Implementación

Contraseñas derivadas con scrypt y sal aleatoria, guardadas en `data/users.json`, excluido de Git. Las claves de ejemplo del código y del formulario son intencionadamente públicas y nunca deben usarse como cuentas reales.

Cookie de sesión HttpOnly y SameSite=Strict; atributo Secure con `NODE_ENV=production`, que requiere HTTPS. Token CSRF por sesión para mutaciones y rechazo de orígenes diferentes. Diez intentos fallidos de identificación por dirección en quince minutos; máximo cinco sesiones activas por cuenta. Tokens y contadores se mantienen en memoria.

No hay recuperación o cambio de contraseña, provisión de usuarios desde el panel, auditoría ni almacenamiento compartido de sesiones. No se considera una entrega para clientes reales. El servicio sigue siendo local y funciona con un único proceso.

## Pendiente del siguiente bloque

Las consultas particulares ya están separadas del canal comunitario y cuentan con una bandeja específica para Gestión VecinoIA; el administrador no puede acceder a ellas. Ver `CONSULTAS-PARTICULARES.md`. La administración de cuentas desde el panel sigue pendiente.

La carga, revisión y publicación de documentos se han añadido en un bloque posterior; ver CARGA-DOCUMENTOS.md. IA generativa y avatar siguen pendientes.
