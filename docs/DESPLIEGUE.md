# Preparación para publicar

16 de octubre de 2026. No hay aplicación pública ni repositorio remoto todavía. El usuario necesita crear las cuentas y solicita guía. El servidor sigue disponible localmente.

## Preparación técnica

- Node 24 y dependencias fijadas por `pnpm-lock.yaml`; arranque `node server.mjs`.
- Plantilla `Dockerfile` para servicios que admitan contenedores. No se ha construido la imagen en este ordenador: Docker no está disponible. Validar la construcción en el alojamiento antes de dar el despliegue por correcto.
- `HOST=0.0.0.0`, `NODE_ENV=production`, `PORT` definido por el alojamiento y `DATA_DIR` apuntando a un disco persistente escribible por el proceso. No usar la carpeta efímera del contenedor para datos que deban conservarse.
- Guardar `OPENAI_API_KEY` como secreto del alojamiento; `OPENAI_MODEL=gpt-5-mini`. No subir `.env` al repositorio ni a la imagen.
- Verificación de disponibilidad mediante `GET /healthz`; solo confirma que el proceso HTTP responde, no el saldo ni la disponibilidad de OpenAI.
- Usar una sola instancia: JSON local no admite escrituras coordinadas entre réplicas. Las sesiones y límites son de memoria y se reinician al arrancar.
- Servir con HTTPS; las cookies de producción llevan Secure. El disco debe conservar JSON, usuarios y subcarpeta de documentos. Comprobar permisos de escritura del volumen montado.
- La instancia pública inicial tendrá datos de ejemplo nuevos: los documentos locales subidos no viajan con el código. Cargar y publicar otra vez los ejemplos necesarios para la demo, o preparar una migración explícita solo de datos ficticios.

## Repositorio

`.gitignore` excluye clave local, datos, archivos subidos, caché pnpm, dependencias y material de pruebas. También excluye el contexto pegado originalmente, que es material local y no documentación final de entrega. Antes de publicar, revisar la lista efectiva de archivos y escanear posibles secretos sin mostrar sus valores. No subir ZIP de toda la carpeta ni usar «añadir todos los archivos» desde el Explorador.

## Pendientes para el usuario

Crear cuenta de GitHub; elegir nombre y visibilidad del repositorio; elegir alojamiento y aceptar sus condiciones y coste si lo hay. No se ha contratado ningún servicio. Configurar allí un disco persistente y secreto de API. Tras publicar, probar acceso desde otro equipo, tres roles, respuesta de IA, carga documental y persistencia después de reiniciar.

Referencias técnicas: [Docker para Node.js](https://docs.docker.com/guides/nodejs/) y [variables de entorno de Node.js](https://nodejs.org/api/process.html#processenv).
