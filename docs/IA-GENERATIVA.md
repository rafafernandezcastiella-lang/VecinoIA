# Integración de IA generativa

Conexión preparada para la API Responses de OpenAI. Modelo configurable mediante `OPENAI_MODEL`; valor inicial `gpt-5-mini`. Clave privada en variable de entorno o `.env`, excluido de Git y nunca enviado al navegador.

## Estado de activación — 16 de octubre de 2026

Tras la recarga de créditos y configuración local de la clave, la prueba real recibió HTTP 200. La pregunta sobre usar la piscina a las 20:00 en verano produjo una respuesta generativa con fuente validada, indicando el horario de 10:00 a 21:00. Una pregunta sobre el saldo bancario actual, ausente de los documentos ficticios, devolvió información insuficiente y ofreció derivación al administrador sin inventar una cifra. El servidor en el puerto 3000 confirma modo generativo configurado. Son dos comprobaciones iniciales; queda pendiente una evaluación más amplia de calidad.

## Funcionamiento preparado

- El servidor filtra primero las fuentes publicadas y procesadas de la comunidad autorizada.
- La pregunta y el contexto seleccionado se envían a OpenAI; no se envían consultas particulares, incidentes, claves o credenciales de vecinos.
- Contexto limitado: todos los documentos si no superan 32.000 caracteres; en conjuntos grandes, hasta veinte fragmentos de 1.400 caracteres seleccionados por términos. No se usa búsqueda por embeddings en esta versión.
- Salida estructurada con respuesta, suficiencia y citas. Se valida que cada identificador pertenezca al contexto enviado y que la cita aparezca literalmente en él, normalizando espacios.
- La validación de citas no garantiza por sí sola que cada afirmación de la respuesta sea correcta: pendiente evaluación con respuestas reales y supervisión del administrador.
- Una fuente retirada durante la consulta no se devuelve al vecino.
- Sin soporte o con citas inválidas, se ofrece derivación al administrador.
- Si falla el proveedor, se muestra un aviso y se vuelve a la búsqueda documental local.
- Máximo veinte peticiones por usuario en diez minutos y tres peticiones simultáneas. Estos límites son locales y no sustituyen los controles de gasto del proveedor.
- No se activan herramientas externas ni navegación del modelo. Cada pregunta se procesa de forma independiente, sin historial conversacional enviado al proveedor.
- Se solicita `store: false`; esto no constituye una garantía de ausencia de retención en todos los sistemas del proveedor.

## Configuración por el usuario

1. Acceder a la plataforma de OpenAI con la cuenta elegida.
2. Crear una clave de proyecto y guardarla únicamente en `.env` después de `OPENAI_API_KEY=`.
3. Revisar facturación, saldo y límites del proyecto. No compartir claves ni datos de tarjeta en el chat.
4. Reiniciar VecinoIA y probar con datos ficticios. Antes de confirmar la activación, verificar una respuesta real con cita y otra pregunta sin soporte que se derive.

El paso 4 se ha comprobado con dos consultas reales el 16 de octubre de 2026, después del rechazo inicial por cuota del día anterior.

## Referencias oficiales

- [Primeros pasos y claves](https://developers.openai.com/api/docs/quickstart).
- [Salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).
- [Modelo GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini).
- [Errores de cuota, facturación y límites](https://developers.openai.com/api/docs/guides/error-codes).
