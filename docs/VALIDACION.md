# Validación de la primera versión local

13 de octubre de 2026.

## Comprobaciones realizadas

- Sintaxis: `node --check server.mjs` y `node --check public/app.js`, correctas.
- Integración: `node --test --test-isolation=none`, dos pruebas aprobadas.
- Consulta creada, respondida y cerrada; persistencia comprobada al reiniciar el servidor de pruebas.
- Una consulta de Los Olivos no aparece en Plaza Mayor y no puede editarse utilizando el identificador de Plaza Mayor.
- Avisos persistentes, filtrados por comunidad.
- Entradas vacías y JSON nulo rechazados.
- FAQ con fuentes diferentes para cada comunidad; dudas desconocidas o con varios temas se derivan.
- Respuestas HTTP 200 de la aplicación local, JavaScript, CSS y datos de ambas comunidades.

El comando `node --test` intentó crear un proceso de prueba y encontró `spawn EPERM` en el entorno restringido. Se ejecutó el mismo conjunto con aislamiento de procesos desactivado y pasó. No se ampliaron permisos.

## Pendiente

No se ha automatizado la revisión visual ni la interacción en navegador. Revisar la apariencia, el teclado, móvil y los formularios con el recorrido de `PLAN.md`. No se han validado IA generativa, autenticación o alojamiento público porque todavía no están implementados.

## Revisión visual ANPARA — 13 de octubre

Tras aplicar la identidad y las fotografías se comprobó con Playwright y Edge sin ventana, usando un perfil temporal:

- Escritorio a 1440 px y móvil a 390 px: capturas revisadas, sin desbordamiento horizontal de la página; navegación móvil con desplazamiento horizontal propio.
- Cambio de comunidad: el fondo pasa de Los Olivos a Plaza Mayor.
- Asistente: respuesta de Plaza Mayor sobre ausencia de piscina con su fuente.
- Solicitud desde servicios: categoría Energía seleccionada en el formulario.
- Ningún error JavaScript durante esos recorridos.
- HTTP 200 para el tema corporativo y ambas imágenes, con tipos MIME correctos.
- Las dos pruebas de integración anteriores siguen aprobadas.

Las capturas temporales están en `.preview/`, ignorada por Git. Pendiente la revisión exhaustiva de accesibilidad y el resto del recorrido completo de formularios; esta comprobación visual no cubre IA generativa o autenticación.

## Acceso y permisos — 13 de octubre

`node --test --test-isolation=none`: cuatro pruebas de integración aprobadas. Cubren identificación, contraseñas incorrectas, datos de cuenta sin hash expuesto, cookies, CSRF, rechazo de origen diferente, revocación al salir, separación por comunidad y autor, suplantación de propietario, bloqueo de permisos administrativos, persistencia y fuentes del asistente. Los hashes guardados no contienen las contraseñas de ejemplo en texto claro. No se ha realizado auditoría de producción.

Recorrido en Edge con perfil temporal: rechazo de contraseña incorrecta; vecino con una sola comunidad y sin selector de rol o administración; sesión conservada al recargar; cierre de sesión; administrador con dos comunidades y cambio a Plaza Mayor; perfil de Gestión VecinoIA. Vistas de escritorio a 1440 px y móvil a 390 px sin desbordamiento horizontal ni errores JavaScript. Capturas revisadas en `.preview/login-desktop.png`, `.preview/login-mobile.png`, `.preview/neighbor-mobile.png` y `.preview/admin-auth.png`.

## Solicitud y envío de documentos — 13 de octubre

Seis pruebas de integración aprobadas, incluyendo las cuatro del acceso. Las nuevas cubren solicitudes privadas por vecino, asociación del autor desde sesión, validación de correo/teléfono, documentos de otra comunidad, confirmación restringida al gestor y persistencia. Descarga PDF sin sesión rechazada; acceso a otra comunidad rechazado.

PDF generado abierto con PyMuPDF: una página, texto extraíble y caracteres españoles legibles. Recorrido en Edge con servidor y almacenamiento temporales: descarga PDF, solicitud por correo, solicitud por WhatsApp, destinos correctos de enlaces preparados, confirmación manual, aislamiento de solicitudes entre vecinos y apertura del documento solicitado tras identificarse. Móvil a 390 px sin desbordamiento, sin errores JavaScript. No se abrieron aplicaciones externas ni se enviaron mensajes. Capturas en `.preview/document-deliveries.png` y `.preview/documents-mobile.png`.

## Consultas particulares — 13 de octubre

Ocho pruebas de integración aprobadas. Las nuevas comprueban bloqueo de lectura y respuesta al administrador, privacidad por autor, rechazo de suplantación, categorías y campos inválidos, separación respecto al estado y API comunitarios, respuesta por gestión, bandeja de varias comunidades y restricción a las asignadas, persistencia, y migración de servicios anteriores sin pérdidas ni duplicados.

Recorrido completo en Edge con almacenamiento temporal: crear consulta comunitaria y consulta particular de Gas en Los Olivos; crear consulta particular de Luz en Plaza Mayor; comprobar que el administrador solo ve la comunitaria y recibe rechazo al consultar la API privada; gestión ve ambas particulares y responde a una de Los Olivos aunque esté seleccionado Plaza Mayor; filtrar por estado; comprobar la respuesta como vecino y la ausencia de acceso del segundo vecino. Vista móvil a 390 px sin desbordamiento horizontal; ningún error JavaScript. Capturas en `.preview/private-neighbor.png`, `.preview/private-management.png` y `.preview/private-mobile.png`.

## Carga y publicación documental — 14 de octubre

Once pruebas de integración aprobadas con `node --test --test-isolation=none`. Se comprueban procesamiento real de PDF y DOCX, borrador TXT no visible ni descargable para vecinos, publicación con revisión obligatoria, permisos por rol y comunidad, descarga idéntica al original, fragmento con fuente, retirada y bloqueo de nuevas respuestas/descargas/confirmaciones de envío, persistencia del estado, archivo vacío, tamaño superior a 5 MB, formato no admitido, archivos dañados y PDF sin texto con aviso de OCR. La retirada de una fuente precargada también elimina su FAQ de nuevas respuestas y del estado enviado al vecino.

Recorrido en Edge con almacenamiento temporal: subir TXT como administrador, revisar borrador, comprobar invisibilidad al vecino, publicar como gestión, descargar el original como vecino, preguntar por el gimnasio y abrir la fuente, retirar como administrador y comprobar derivación en una nueva pregunta. Vista móvil a 390 px sin desbordamiento y sin errores JavaScript. Capturas revisadas en `.preview/document-review.png`, `.preview/document-review-mobile.png` y `.preview/document-assistant.png`.

## Equivalencias gym/gimnasio — corrección del 14 de octubre

Doce pruebas aprobadas. Preguntas con «gym», «GYM», «gimnasio» y ambos términos encuentran la misma fuente publicada y conservan su respuesta literal. También se verifica una fuente que contiene «gym» y una pregunta con «gimnasio». La equivalencia no permite consultar fuentes de otra comunidad ni fuentes retiradas. No se modifica el texto del documento ni se añade un modelo generativo.

## Integración de IA — estado al 15 de octubre

Diecinueve pruebas locales aprobadas con proveedor simulado o desactivado. Se verifican el formato de petición, citas literales, rechazo de fuentes ajenas/inventadas, modo de búsqueda sin clave, reserva ante fallos, límite de contexto, permisos, límite por usuario y retirada de fuente durante una respuesta. Estas pruebas no acreditan la calidad de las respuestas de un modelo real.

La comprobación inicial recibió HTTP 429 y tipo `insufficient_quota`.

## Activación real — 16 de octubre

Después de la recarga de créditos y configuración local, Responses devuelve HTTP 200 para una consulta sobre la piscina ficticia de Los Olivos a las 20:00 en verano. El asistente responde que está dentro del horario de 10:00 a 21:00 y supera la validación de fuente y cita. Una segunda consulta sobre el saldo bancario actual devuelve información insuficiente, sin fuente ni cifra inventada, y ofrece derivación al administrador. El servidor local activo confirma configuración generativa mediante una sesión de prueba cerrada al terminar. No se registran claves ni tokens. Estas dos consultas no sustituyen una evaluación amplia de calidad.

## Consejos, ayudas y servicios — 16 de octubre

Veinte pruebas aprobadas. La nueva prueba verifica creación restringida a personal autorizado, rechazo de categoría inválida, borrador invisible para vecinos, confirmación de revisión obligatoria, separación por comunidad incluso para administradores de varias, publicación visible, bloqueo de edición hasta retirar, persistencia tras reinicio y nueva publicación por gestión.

Recorrido en Edge con datos temporales: creación de ficha de Gas, publicación, retirada, edición y republicación; consulta como vecino, filtro de Servicios, solicitud privada de Gas desde la ficha y comprobación de que otro vecino de otra comunidad no ve la ficha. Sin errores JavaScript y sin desbordamiento a 390 px. Capturas: `.preview/advice-admin.png`, `.preview/advice-neighbor.png`, `.preview/advice-mobile.png`. Sin llamadas a la API de IA durante estas pruebas.

## Preparación para alojamiento — 16 de octubre

Veintiuna pruebas aprobadas. La nueva prueba usa DATA_DIR temporal, comprueba healthcheck sin datos sensibles, cookie Secure en modo producción y persistencia de una ficha después de reiniciar. Se excluyen caché pnpm y contexto local de Git. Escaneo de patrones de secretos en candidatos a publicación sin mostrar valores. La imagen Docker no se ha construido: falta Docker en este ordenador. No se ha validado ningún alojamiento público.

## Web pública de Railway — 16 de octubre

https://vecinoia-production.up.railway.app/ y healthcheck responden 200. La primera prueba de login detectó comparación de origen HTTP frente al HTTPS público; corregida en `8e40286`. Se repiten las veintiuna pruebas locales con éxito y la prueba pública confirma login 200 para vecino, administrador y gestión, cookies Secure, una comunidad para el vecino y dos para personal, cuatro fichas publicadas, rechazo 403 a otra comunidad y rechazo 403 del canal particular para administración. La pregunta de piscina a las 20:00 obtiene IA real con fuente. `.env` y `data/demo.json` no se sirven públicamente (404). Sesiones de comprobación cerradas. No se crearon consultas ni contenidos durante esta verificación. Persistencia pública tras reinicio aún pendiente.

## Prueba pública de persistencia — resultado fallido

16 de octubre. Se carga, revisa y publica el ejemplo ficticio `normas-gimnasio.txt`; la descarga original coincide byte a byte. Se activa despliegue `9264690` y se confirma reinicio mediante invalidación de una sesión previa. Tras identificarse de nuevo, el documento `a253ab44-27e3-412a-bb4a-8fc728afafd9` ya no figura entre las publicaciones: la prueba falla. No se acredita persistencia. Pendiente revisar en Railway asociación efectiva del volumen con VecinoIA y coincidencia entre Mount Path y DATA_DIR. No repetir cargas ni desplegar cambios adicionales hasta revisar esta configuración. Este resultado se conserva localmente para evitar otro redespliegue antes de corregirla.

## Segunda prueba pública de persistencia — superada

Tras ver el volumen asociado con un cambio pendiente, se indica aplicar Deploy y el usuario confirma Online. Se carga y revisa el ejemplo ficticio del gimnasio; se publica el documento `6d3e0db8-cce9-4beb-9856-b7e2ea871ce2` y su descarga coincide con el archivo local. Se activa despliegue `7315a86` y se observa revocación de la sesión previa, confirmando reinicio. Con una sesión nueva, el documento conserva identificador y estado publicado y el SHA-256 de la descarga coincide con el previo. Prueba superada sin alterar otros documentos. Esto acredita conservación del JSON y de ese archivo durante el despliegue; no acredita restauración de backups ni retención después de cancelar o expirar el alojamiento.

## Limpieza de ensayos autorizada por el usuario

Se respaldan las tres consultas comunitarias y dos particulares y se vacían una sola vez al desplegar `788a987`. Comprobación remota posterior: cero registros de ambos tipos, con documentos y fichas conservados en ambas comunidades. La prueba local comprueba copia original íntegra, conservación de otras colecciones y ausencia de un segundo borrado. Veintidós pruebas pasan. Se retira la llamada de limpieza del arranque tras confirmar el resultado. Los backups quedan fuera del repositorio y de las rutas públicas.

## Resumen y eliminación de completadas — 17 de octubre

Veintitrés pruebas aprobadas. La nueva prueba cubre sesión, rol, CSRF, comunidad, borrado solo de Resuelta, conservación de pendientes/activas y canal privado, aislamiento de otras comunidades, repetición con cero eliminadas y persistencia tras reinicio. Edge verifica recuentos, filtros, cambio de estado a Terminada, eliminación, botón deshabilitado en cero, preservación de activas, recarga y móvil a 390 px sin errores JavaScript ni desbordamiento.

La limpieza global de ensayos solicitada para esta fecha respalda dos comunitarias y dos particulares. Después de `73e3633`, ambas bandejas públicas están vacías y se conservan documentos y fichas. El recurso público app.js contiene los controles nuevos. Se elimina la llamada temporal de arranque una vez verificado el resultado.

## Avisos urgentes — 17 de octubre

Veinticuatro pruebas aprobadas. La nueva prueba verifica tipo ordinario/urgente, rechazo de valores inválidos, publicación y finalización restringidas a personal autorizado, CSRF, separación por comunidad, ausencia de metadatos de correo en el estado del vecino, cuentas destinatarias simuladas por comunidad, cero correos reales y persistencia del aviso finalizado tras reinicio.

Edge con contextos separados comprueba ordinario sin banner, urgente con banner, dos destinatarios simulados para Los Olivos, asunto y contenido del correo de ejemplo, actualización del banner sin perder el asunto escrito por el vecino, otra comunidad sin ese aviso, finalización que retira el banner y conserva historial, animación desactivada con movimiento reducido y móvil a 390 px sin desbordamiento. Sin errores JavaScript ni mensajes reales. Capturas locales: `.preview/urgent-admin.png`, `.preview/urgent-neighbor.png`, `.preview/urgent-mobile.png`. No se añaden avisos de ensayo a la web pública.

## Edición y eliminación de ordinarios — 17 de octubre

Veinticinco pruebas aprobadas. Se verifica edición de un aviso precargado sin duplicados, persistencia de la sustitución, borrado persistente sin reaparecer al reiniciar, edición y borrado de uno nuevo, autorización, CSRF, título inválido y protección de otras comunidades, documentos y avisos urgentes.

Edge comprueba edición desde el panel, cancelación y aceptación del borrado, recarga sin recuperar el ejemplo eliminado, borrado de un aviso nuevo y vista del vecino actualizada tras identificarse. Se etiqueta explícitamente el campo Contenido para que tenga nombre accesible independiente del texto prellenado. Vista móvil a 390 px sin desbordamiento ni errores JavaScript. Capturas locales `.preview/ordinary-admin.png` y `.preview/ordinary-mobile.png`. Las pruebas usan datos temporales; no se editan ni eliminan avisos públicos del usuario.

## Contacto individual y portada — 17 de octubre

Veintiséis pruebas pasan. Se verifica destinatario, rol, comunidad, CSRF, remitente de sesión, ausencia de directorio de vecinos para residentes, privacidad frente a otro vecino y otra comunidad, lectura solo por destinatario, repetición idempotente y persistencia. El canal de servicios privados conserva su autorización independiente.

En Edge, administrador no ve tarjeta ni botón de hablar con administración; residente sí. Se envía un aviso individual en almacenamiento temporal, se muestra su señal al destinatario sin borrar texto en un formulario, se marca leído y se comprueba actualización de administración, otro vecino sin acceso y otra comunidad con destinatarios distintos. Móvil a 390 px sin desbordamiento ni errores. Se comprueba también la tarjeta de bienvenida al inicio en escritorio y vistas de 390/320 px. Capturas locales `.preview/neighbor-contact-admin.png`, `.preview/neighbor-contact-resident-mobile.png` y `.preview/community-title-desktop.png`. No se crean mensajes en el servicio público.

## Ocultación individual de anuncios — 18 de octubre

Veintisiete pruebas aprobadas. La nueva prueba comprueba permisos, CSRF, alcance individual aunque el cliente intente indicar otro usuario, acceso a comunidad, repetición idempotente, ocultación de ordinarios y urgentes, preservación del aviso para otro vecino y administración, persistencia tras reinicio y ausencia de alteraciones documentales. La edición del mismo anuncio mantiene la preferencia de ocultación.

Edge verifica el enlace «quitar anuncio», desaparición y contador, recarga, otro vecino sin cambios, ausencia de esa acción en administración, retirada individual del banner urgente manteniendo un asunto sin enviar, estado vacío cuando se quitan todos y vista móvil a 390 px sin desbordamiento ni errores JavaScript. Capturas `.preview/dismiss-before.png`, `.preview/dismiss-empty-mobile.png` y `.preview/dismiss-control-mobile.png`. Los anuncios de la web pública no se usan para probar ni se ocultan.
