# VecinoIA

Portal inteligente y replicable para comunidades de propietarios, basado en la propuesta de ANPARA: IA supervisada por el administrador, incidencias, documentos y espacio de consejos, ayudas y servicios energéticos y técnicos. Proyecto iniciado desde cero el 13 de octubre de 2026 con Codex. Todos los datos son ficticios. IA generativa y espacio editorial implementados localmente y comprobados el 16 de octubre. Publicación y entregables pendientes.

## Arrancar en Windows

Desde la carpeta del proyecto:

```powershell
pnpm install --frozen-lockfile
node server.mjs
```

Abrir http://127.0.0.1:3000. Para detenerlo, pulsar Ctrl+C en esa terminal. Requiere Node 22.13 o superior y las dependencias del archivo de bloqueo; ya están instaladas en el entorno de trabajo actual. Se ha usado pnpm 11.25.0.

```powershell
node --test
```

## Primera versión local

- Dos comunidades con contenidos, colores y fuentes diferentes.
- Portal con avisos, reunión y documentos consultables.
- Asistente con IA de OpenAI, fuentes publicadas, citas y derivación al administrador; requiere clave y saldo de API.
- Consejos, ayudas y servicios por comunidad con borradores, revisión, publicación y retirada.
- Consultas y solicitudes de energía, seguros y mantenimiento.
- Identificación con usuarios ficticios, sesión y permisos comprobados en servidor.
- Consultas visibles únicamente al vecino autor y a los gestores autorizados.
- Descarga de documentos en PDF y solicitud de envío por correo o WhatsApp.
- Bandeja con mensajes preparados y confirmación manual del envío externo.
- Consultas particulares privadas de luz, gas, seguros, mantenimiento y otras categorías.
- Bandeja multicomunidad de Gestión VecinoIA, con respuesta y filtro por estado.
- Panel para responder, cambiar estados y publicar avisos.
- Carga de PDF con texto, DOCX y TXT, con revisión, publicación y retirada por comunidad.
- Descarga del archivo original y búsqueda de fragmentos en fuentes publicadas.
- Persistencia local en `data/demo.json`, excluida de Git.

## Límites actuales

La identificación y los permisos ya funcionan con cuentas ficticias. Las claves de demo se muestran deliberadamente en la pantalla de acceso. No introducir datos personales ni usar contraseñas reales. No hay todavía provisión de usuarios, recuperación de contraseña o revisión para clientes reales. La IA utiliza fuentes publicadas de la comunidad y valida la presencia literal de sus citas. Esto no garantiza la corrección de cada afirmación; cada pregunta se procesa de forma independiente y con contexto limitado. Ante fallos se conserva la búsqueda documental. Las fichas editoriales no se incorporan automáticamente a las fuentes del asistente. No se realiza OCR y los archivos con errores no se publican. El catálogo no envía solicitudes a proveedores ni formaliza contratos. Las consultas particulares se atienden desde Gestión VecinoIA y no son visibles al administrador.

El servidor escucha solo en el ordenador local. No hay despliegue, URL pública, repositorio remoto o entregables en Google Drive. La persistencia JSON sirve para la prueba local, no para un servicio con múltiples instancias.

## Documentación

- [Base de ANPARA y alcance del concurso](docs/BASE-CONCURSO.md)
- [Alcance y criterios de aceptación](docs/ALCANCE.md)
- [Arquitectura y modelo de datos](docs/ARQUITECTURA.md)
- [Calendario y entrega](docs/PLAN.md)
- [Registro de instrucciones](docs/PROMPTS.md)
- [Acceso, cuentas ficticias y límites](docs/ACCESO.md)
- [Solicitud y envío manual de documentos](docs/ENVIO-DOCUMENTOS.md)
- [Consultas particulares y privacidad](docs/CONSULTAS-PARTICULARES.md)
- [Carga, revisión y publicación de documentos](docs/CARGA-DOCUMENTOS.md)
- [IA generativa: conexión, configuración y estado](docs/IA-GENERATIVA.md)

- [Consejos, ayudas y servicios](docs/CONSEJOS-AYUDAS-SERVICIOS.md)
- [Guion de demostración](docs/GUION-DEMO.md)

## Próximos hitos

Contrastar las bases originales, elegir almacenamiento y alojamiento para la versión pública y preparar repositorio, documentos y vídeo de entrega. La operación con datos reales queda fuera de esta primera demo.

