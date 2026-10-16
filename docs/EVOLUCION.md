# Ampliación acordada de VecinoIA

13 de octubre de 2026. Requisitos ampliados en conversación de voz tras revisar el diseño ANPARA. Este documento define trabajo pendiente, no funcionalidades ya implementadas.

Actualización posterior del mismo día: identificación, sesión y autorización por rol, comunidad y autor implementadas para cuentas ficticias. Detalle en `ACCESO.md`. Provisión de usuarios desde gestión, documentos y separación de consultas particulares siguen pendientes.

Segunda actualización: implementadas la solicitud y preparación del envío manual de documentos, y la separación de consultas particulares con bandeja de Gestión VecinoIA. Ver `ENVIO-DOCUMENTOS.md` y `CONSULTAS-PARTICULARES.md`. Siguen pendientes provisión de usuarios, carga de archivos, IA generativa, despliegue y avatar.

## Acceso individual y permisos

- Cada usuario se identifica con credenciales individuales proporcionadas por el equipo de gestión.
- Vecino: acceso solo a comunidades autorizadas y a sus propias consultas particulares.
- Administrador: acceso a todas las comunidades que administra, a sus contenidos y a las consultas comunitarias correspondientes.
- Gestión VecinoIA: administración de usuarios y permisos, atención de consultas particulares y carga de documentos en nombre de un administrador autorizado.
- Los roles y permisos se comprueban en servidor. No basta con ocultar pantallas o cambiar un selector.
- Las contraseñas no se guardan en texto claro. Se requiere sesión, cierre de sesión y controles de acceso por recurso.
- La demostración del hackatón mantendrá usuarios y datos ficticios aunque incorpore identificación y permisos funcionales.

## Conocimiento del asistente

- El administrador puede subir documentos de sus comunidades desde su panel.
- El equipo de gestión también puede cargar documentos que el administrador le facilite.
- La carga debe mostrar si el contenido se ha procesado correctamente y está disponible para consulta; definir formatos y límites al implementar.
- El asistente consulta únicamente fuentes de la comunidad autorizada y cita el documento que respalda cada respuesta.
- Si el contenido no permite responder, ofrece derivación al administrador.
- No se promete comprensión de cualquier archivo o respuesta a preguntas sin soporte documental.

## Consultas particulares y recomendaciones

- Página propia, separada del canal de asuntos de la comunidad.
- Luz y gas como categorías iniciales independientes, tanto para consultas como para estudios de suministros individuales.
- Seguros, mantenimiento y otras dudas particulares como categorías ampliables.
- Estas solicitudes se atienden desde gestión VecinoIA o el equipo asignado al servicio; no se envían automáticamente al administrador de la comunidad.
- El vecino ve solo sus solicitudes, estados y respuestas.
- Las recomendaciones no se presentan como comparaciones reales de ofertas hasta disponer de fuentes, criterios y datos verificados.
- No se realizan contratos ni pagos en la demostración.

## Avatar animado — fase posterior

El usuario quiere evolucionar desde el chat hacia un asistente visual animado que dé presencia al portal. Se deja fuera del compromiso inicial del hackatón y se mantiene como evolución del producto.

La interfaz del asistente se separará de la lógica de preguntas, fuentes y derivación para que se pueda añadir el avatar conservando esas funciones. La primera fase futura puede ser un personaje animado con estados de espera, escucha y respuesta; voz y sincronización se evaluarán después. No se ha creado todavía ningún avatar.

## Orden de implementación propuesto

1. Identificación, sesiones y autorización por comunidad y usuario.
2. Separación de consultas comunitarias y consultas particulares; bandeja de gestión VecinoIA.
3. Carga y procesamiento de documentos por comunidad.
4. Integración de IA con fuentes y pruebas de aislamiento.
5. Revisión del alcance restante frente al plazo del hackatón.
6. Avatar animado después de la entrega inicial.

El calendario anterior es provisional: esta ampliación requiere una nueva estimación antes de comprometer todas las funciones para la entrega.

## Base confirmada el 14 de octubre

La propuesta ANPARA descrita por el usuario pasa a ser la base del concurso: portal inteligente, IA supervisada, incidencias, documentos y consejos, ayudas y servicios energéticos/técnicos. `BASE-CONCURSO.md` define el producto y sus responsabilidades; `ALCANCE.md` recoge el estado actual y los criterios de entrega; `PLAN.md` actualiza los hitos restantes. La aplicación profesional y el avatar se mantienen como evolución posterior.

Actualización del mismo día: carga y procesamiento de PDF, DOCX y TXT, revisión, publicación y retirada implementadas. Solo las fuentes publicadas alimentan las nuevas respuestas de FAQ y búsqueda de fragmentos. Ver CARGA-DOCUMENTOS.md. Pendientes IA generativa, consejos/ayudas, despliegue y funciones profesionales.
