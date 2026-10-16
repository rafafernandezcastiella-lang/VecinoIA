# Arquitectura inicial

## Decisión para la primera revisión

Aplicación web con HTML, CSS y JavaScript; servidor Node con API HTTP. Sin dependencias externas para poder revisar el recorrido inmediatamente con las herramientas disponibles. Esta elección es una base de demostración y se revisará para el despliegue.

## Estructura

- `public/`: interfaz y estilos adaptables.
- `src/communities.mjs`: configuración y contenidos ficticios por comunidad; consulta de FAQ.
- `server.mjs`: servidor local, validación y persistencia.
- `data/demo.json`: consultas y avisos creados durante la demo; ignorado por Git.
- `tests/`: integración de API, aislamiento de registros y persistencia.
- `docs/`: decisiones, alcance, calendario e instrucciones.

## Modelo de datos

| Entidad | Campos principales | Relación |
|---|---|---|
| Comunidad | id, nombre, color, dirección ficticia, reunión | Configuración del portal |
| Documento | id, título, contenido, actualización | Pertenece a una comunidad |
| Pregunta frecuente | términos, respuesta, fuente | Fuente documental de la misma comunidad |
| Aviso | id, título, contenido, fecha, categoría | communityId para avisos creados |
| Consulta | id, asunto, mensaje, categoría, prioridad, estado, respuesta, fecha | communityId y vecino ficticio |
| Consulta particular | id, asunto, mensaje, categoría, estado, respuesta, fecha | communityId y residentId; colección independiente serviceRequests |

## Límites y evolución

El navegador solicita los registros de la comunidad seleccionada. El servidor filtra y valida la pertenencia al editar. Los perfiles no son credenciales: cualquier usuario de la demo puede cambiar de vista y comunidad. Para clientes reales, la comunidad y los permisos deberán derivarse de una sesión autorizada, con separación por usuario y controles en servidor.

El almacenamiento local escribe un archivo temporal y lo renombra para reducir el riesgo de escrituras incompletas. No soporta varias instancias ni almacenamiento efímero de alojamiento. Se sustituirá por una base de datos antes de usarlo en esos entornos.

La integración de IA será exclusivamente desde servidor, con la clave en variable de entorno y contexto limitado a la comunidad. Las fuentes deberán validarse y las preguntas sin soporte ofrecerán derivación. Ninguna clave se enviará al navegador o a Git.
