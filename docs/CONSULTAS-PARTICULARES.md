# Consultas particulares y atención de Gestión VecinoIA

Implementado el 13 de octubre de 2026 con cuentas y datos ficticios.

## Dos canales

- Consultas comunidad: juntas, normas, recibos comunitarios y problemas del edificio; las atiende el administrador de la comunidad. Gestión VecinoIA conserva acceso de gestión autorizado.
- Consultas particulares: luz, gas, seguros, reparaciones de la vivienda y otras dudas; las atiende exclusivamente Gestión VecinoIA. El administrador de la comunidad no puede verlas ni responderlas.

## Vecino

La navegación incluye «Consultas comunidad» y «Consultas particulares». En el canal particular el vecino selecciona una categoría, escribe asunto y mensaje y envía al equipo de VecinoIA. Puede ver estado y respuesta desde la misma página. No se realizan contrataciones, pagos, envíos externos o comparaciones reales de ofertas.

Luz y gas son categorías independientes. «Otras consultas» permite recibir necesidades fuera del catálogo inicial; nuevas categorías se añaden al catálogo y a la validación de servidor.

## Gestión VecinoIA

El perfil de gestión dispone de «Atención particular», una bandeja con solicitudes de todas sus comunidades autorizadas. Cada tarjeta identifica comunidad, vecino y categoría. Puede filtrar por estado y responder de forma privada, marcando Pendiente, En revisión o Resuelta.

La bandeja abarca todas las comunidades asignadas aunque el selector del portal esté situado en una comunidad concreta. Al responder, el servidor valida la comunidad real de la solicitud y los permisos del gestor.

## Privacidad en servidor

- Solicitudes particulares almacenadas en `serviceRequests`, separadas de `tickets` comunitarios.
- API específica: `/api/service-requests`.
- Lectura limitada al vecino autor o a gestión con permiso para esa comunidad.
- Administración recibe rechazo de acceso, incluso utilizando directamente la API.
- El estado comunitario y sus contadores no incluyen asuntos particulares.
- La identidad del autor se toma de la sesión y no puede enviarse suplantada desde el formulario.
- Solo gestión puede responder y cambiar el estado de una solicitud particular.
- El vecino no puede crear solicitudes de comunidades a las que no pertenece.

## Migración de la primera versión

Las consultas antiguas con categoría Energía, Seguros o Mantenimiento, procedentes del catálogo anterior, pasan al canal particular al arrancar el servidor. Se conservan identificador, autor, texto, estado y respuesta; Energía se muestra como «Luz y gas». No se atribuyen a un vecino las consultas antiguas sin autor verificable; solo las ve gestión autorizada.

La migración se persiste y no duplica solicitudes al reiniciar. Las nuevas consultas comunitarias admiten General, Incidencia y Recibos. Las reparaciones del edificio se registran como Incidencia; las reparaciones particulares de una vivienda se registran en el canal privado.

## Prueba manual

1. Acceder como `vecino.olivos` y crear una consulta particular de Gas con datos ficticios.
2. Acceder como `administrador`: la consulta no aparece en Administración y no existe la bandeja de atención particular.
3. Acceder como `gestion`, abrir Atención particular, responder y marcar como Resuelta.
4. Volver a `vecino.olivos` y comprobar la respuesta en Consultas particulares.
5. Acceder como `vecino.olivos2` y comprobar que no puede ver la solicitud del otro vecino.
