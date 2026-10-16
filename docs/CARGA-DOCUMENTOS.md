# Carga y supervisión de documentos

Implementado el 14 de octubre de 2026. Solo se usan documentos y cuentas ficticias en la demo.

## Prueba recomendada

1. Acceder como `administrador` o `gestion` y seleccionar Los Olivos.
2. Abrir Gestionar documentos.
3. Escribir un título y seleccionar `examples/documentos/normas-gimnasio.txt` o su versión Word DOCX.
4. Pulsar Subir y procesar. El documento queda en Borrador, no visible al vecino.
5. Abrir Revisar texto procesado y comprobar el contenido.
6. Marcar que se ha revisado y pulsar Publicar documento.
7. Acceder como `vecino.olivos`: el documento aparece en Documentos y puede descargarse en su formato original o solicitarse por correo/WhatsApp.
8. Preguntar al asistente «¿Cuándo cierra el gimnasio?». La búsqueda devuelve un fragmento del documento publicado y su fuente.
9. Volver a administración y retirar la publicación. El documento deja de aparecer al vecino, se bloquea su descarga y se excluye de las nuevas respuestas. Puede volver a publicarse tras revisión.

## Formatos y límites

- PDF con texto extraíble, hasta 100 páginas; no se realiza OCR.
- Word DOCX, sin macros ni cifrado; se comprueba el tamaño declarado de los contenidos del ZIP antes de extraer texto.
- TXT codificado en UTF-8.
- Máximo 5 MB por archivo y 200.000 caracteres de texto extraído.
- Máximo 50 archivos subidos por comunidad en esta demo; los archivos con error también cuentan.
- Procesamiento en un hilo separado, con límite de memoria de JavaScript y tiempo máximo de 20 segundos. Esto no sustituye una auditoría de producción o un servicio de análisis de archivos.

Los archivos vacíos o formatos no admitidos se rechazan. Si un archivo admitido está dañado, no tiene texto o necesita contraseña, se conserva con Error de procesamiento y no puede publicarse. El gestor debe corregirlo y subir una versión válida.

## Publicación y permisos

Los documentos nuevos quedan en borrador. Administración y Gestión VecinoIA pueden revisar, publicar y retirar únicamente documentos de comunidades asignadas. Los vecinos solo reciben documentos publicados y procesados correctamente. Las fuentes precargadas de la demo también pueden retirarse.

La API valida permisos, comunidad, estado y revisión. No basta con ocultar botones. Las rutas de descarga sirven los originales de archivos subidos y PDF generado para documentos precargados. Un borrador o archivo retirado no se puede descargar como vecino, solicitar para envío ni utilizar como fuente de nuevas respuestas. Los envíos pendientes se bloquean si la fuente se retira. Lo que un vecino haya leído o descargado previamente no puede revocarse de su dispositivo.

## Asistente actual

Sigue sin IA generativa. Utiliza las FAQ cuyas fuentes están publicadas y una búsqueda de términos en documentos publicados. La respuesta documental cita literalmente un fragmento y muestra la fuente; si no hay soporte o hay ambigüedad entre documentos con la misma puntuación, ofrece derivación. Esta búsqueda no interpreta de forma general tablas, imágenes o preguntas complejas. El siguiente bloque es la integración de IA manteniendo los mismos controles de fuentes y comunidad.

## Persistencia y despliegue

Los metadatos, texto y estados se guardan en `data/demo.json`. Los archivos originales se guardan en `data/uploads/`, con identificadores generados por el servidor, fuera del directorio público y excluidos de Git. La API no expone sus rutas de almacenamiento.

Dependencias declaradas y bloqueadas en `package.json` y `pnpm-lock.yaml`: PDF.js para extraer texto de PDF y Mammoth para texto de DOCX. Los archivos se procesan localmente, sin enviar su contenido a un proveedor de IA.

Para publicar se necesitan almacenamiento duradero para datos y archivos y revisar el tratamiento de cargas concurrentes, versiones, eliminación y auditoría. No se implementan todavía edición de texto, sustitución de un archivo, borrado o OCR.

## Referencias técnicas consultadas

- [PDF.js: documentación y ejemplos oficiales](https://github.com/mozilla/pdf.js/blob/master/docs/contents/examples/index.md).
- [Mammoth: extracción de texto de Word](https://github.com/mwilliamson/mammoth.js/).
