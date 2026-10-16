# Preparación para publicar

16 de octubre de 2026. Código subido a GitHub en `rafafernandezcastiella-lang/VecinoIA`, rama `codex/hackathon`. Aplicación pública: https://vecinoia-production.up.railway.app/. Se ha verificado portada, healthcheck, login con tres roles, cookies Secure, permisos por comunidad, bloqueo de consultas particulares para administración y respuesta real de IA con fuente. Corrección HTTPS del proxy: `8e40286`. El usuario comunica volumen creado en `/var/lib/vecinoia`; falta comprobar persistencia pública tras reinicio. La visibilidad privada fue la opción indicada al crear el repositorio; comprobarla en GitHub antes de entregar.

## Preparación técnica

- Node 24 y dependencias fijadas por `pnpm-lock.yaml`; arranque `node server.mjs`.
- `Dockerfile` para servicios que admitan contenedores. Docker no está disponible en este ordenador; la aplicación ya responde desde Railway.
- `HOST=0.0.0.0`, `NODE_ENV=production`, `PORT` definido por el alojamiento y `DATA_DIR` apuntando a un disco persistente escribible por el proceso. No usar la carpeta efímera del contenedor para datos que deban conservarse.
- Guardar `OPENAI_API_KEY` como secreto del alojamiento; `OPENAI_MODEL=gpt-5-mini`. No subir `.env` al repositorio ni a la imagen.
- Verificación de disponibilidad mediante `GET /healthz`; solo confirma que el proceso HTTP responde, no el saldo ni la disponibilidad de OpenAI.
- Usar una sola instancia: JSON local no admite escrituras coordinadas entre réplicas. Las sesiones y límites son de memoria y se reinician al arrancar.
- Servir con HTTPS; las cookies de producción llevan Secure. El disco debe conservar JSON, usuarios y subcarpeta de documentos. Comprobar permisos de escritura del volumen montado.
- Railway monta volúmenes como root. Se indicó configurar `RAILWAY_RUN_UID=0` junto con `DATA_DIR=/var/lib/vecinoia` para permitir la escritura con esta imagen. El usuario confirma despliegue Online y volumen creado; pendiente prueba de conservación tras reiniciar.
- La instancia pública inicial tendrá datos de ejemplo nuevos: los documentos locales subidos no viajan con el código. Cargar y publicar otra vez los ejemplos necesarios para la demo, o preparar una migración explícita solo de datos ficticios.

## Repositorio

`.gitignore` excluye clave local, datos, archivos subidos, caché pnpm, dependencias y material de pruebas. También excluye el contexto pegado originalmente, que es material local y no documentación final de entrega. Antes de publicar, revisar la lista efectiva de archivos y escanear posibles secretos sin mostrar sus valores. No subir ZIP de toda la carpeta ni usar «añadir todos los archivos» desde el Explorador.

## Pendientes para el usuario

Cuenta y repositorio GitHub creados. Railway desplegado durante su prueba inicial; no se ha contratado un plan de pago desde este chat. Clave configurada y conexión real de IA comprobada desde la web pública. Pendientes prueba de carga documental y conservación tras reiniciar, presupuesto y continuidad del alojamiento durante evaluación. Si GitHub sigue privado, conceder acceso al jurado según las bases antes de entregar.

Referencias técnicas: [Docker para Node.js](https://docs.docker.com/guides/nodejs/) y [variables de entorno de Node.js](https://nodejs.org/api/process.html#processenv).
