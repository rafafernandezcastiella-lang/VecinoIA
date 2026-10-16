# Arquitectura — actualizada el 16 de octubre de 2026

## Decisión para la primera revisión

Aplicación web con HTML, CSS y JavaScript; servidor Node con API HTTP. PDF.js extrae texto PDF y Mammoth procesa DOCX. La IA usa OpenAI Responses desde servidor. GitHub conserva el código y Railway sirve HTTPS y un volumen persistente configurado mediante DATA_DIR. Arquitectura de demo de una sola instancia.

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

La sesión autenticada determina rol y comunidades. El servidor comprueba lectura y escritura por comunidad y autor. Las consultas particulares están separadas del canal comunitario: solo el vecino autor y Gestión VecinoIA autorizada pueden acceder. La administración ordinaria no tiene acceso a ese canal. Los documentos y fichas editoriales tienen borrador, publicación y retirada; las fichas no alimentan automáticamente al asistente.

El almacenamiento JSON escribe un archivo temporal y lo renombra. DATA_DIR agrupa JSON, usuarios y uploads en el volumen de Railway; se ha comprobado conservación del registro publicado y original del gimnasio tras un despliegue. No soporta varias instancias ni almacenamiento efímero. Sesiones y límites de uso viven en memoria y se reinician con el proceso. Para operación profesional se requiere revisar base de datos, archivos y backups.

La IA funciona desde servidor con clave privada y contexto limitado a documentos listos y publicados de la comunidad. Las citas se contrastan literalmente y las preguntas sin soporte ofrecen derivación. Esta comprobación no garantiza corrección semántica total. No hay embeddings, OCR ni historial conversacional enviado al proveedor. Ante fallos se conserva búsqueda documental local. Ninguna clave se envía al navegador o a Git.
