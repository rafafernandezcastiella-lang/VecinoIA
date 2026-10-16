# Demostración de VecinoIA

Preparado el 16 de octubre de 2026. Objetivo: 4 minutos y 30 segundos, dejando 30 segundos de margen respecto al máximo de cinco minutos confirmado en la copia local de las bases. Este documento es un guion: aún no hay vídeo grabado ni aplicación pública.

## Preparar el ensayo

Usar solo datos ficticios y comprobar saldo de API. Abrir tres perfiles de navegador o contextos separados: vecino de Los Olivos, administrador y Gestión VecinoIA. Las pestañas normales comparten sesión: no mantienen usuarios distintos. Las cuentas están en `ACCESO.md`.

Preparar `examples/documentos/normas-gimnasio.txt`. Si ya está publicado, mostrar el existente para evitar duplicados. No retirar documentos ni borrar consultas del usuario para ensayar. Comprobar los horarios de la fuente antes de preguntar.

## Recorrido de 4:30

| Tiempo | Pantalla y acción | Mensaje |
|---|---|---|
| 0:00–0:25 | Portada como vecino de Los Olivos | VecinoIA, basado en la propuesta de ANPARA, acerca la información al vecino y reduce consultas repetitivas. Datos y comunidades ficticios. |
| 0:25–1:05 | Preguntar si la piscina puede usarse a las 20:00 en verano; abrir la fuente | La IA utiliza los documentos publicados de esta comunidad y muestra citas. Una pregunta sobre el saldo bancario sin información ofrece consultar al administrador. |
| 1:05–1:45 | Administrador: mostrar revisión y publicación de documento del gimnasio. Vecino: preguntar por el gym | Administración controla el conocimiento disponible mediante borradores, revisión, publicación y retirada. |
| 1:45–2:20 | Crear incidencia ficticia «Luz del portal fundida»; responder como administrador | El vecino puede seguir el estado y la respuesta de sus incidencias. |
| 2:20–2:45 | Descargar documento y mostrar solicitud de envío | El gestor prepara un enlace para correo o WhatsApp. El envío se realiza manualmente desde su aplicación. No enviar mensajes reales en el ensayo. |
| 2:45–3:30 | Consejos, ayudas y servicios: filtrar y solicitar orientación privada de Gas | El portal atiende necesidades particulares de luz, gas y servicios técnicos. Las fichas de ejemplo no son ofertas ni convocatorias vigentes. |
| 3:30–4:05 | Gestión VecinoIA: responder la consulta de Gas; mostrar respuesta como vecino | La consulta particular solo es accesible al vecino autor y a Gestión VecinoIA autorizada. El administrador ordinario no accede a ella. |
| 4:05–4:30 | Administrador: cambiar a Plaza Mayor | Cada usuario accede a sus comunidades autorizadas. La evolución profesional y el avatar animado quedan para después del concurso. |

## Antes de grabar

- Ensayar una vez y medir el tiempo incluyendo las esperas de la IA.
- Refrescar la vista del vecino después de publicar documentos o responder consultas.
- No mostrar claves, `.env`, datos de tarjeta ni archivos personales.
- No presentar envío automático, avatar o ayudas reales como funciones disponibles.
- Si falla la IA, mostrar el aviso y distinguir la búsqueda documental de una respuesta generativa.
- Después del despliegue, repetir el recorrido desde la URL pública y verificar persistencia tras reiniciar. La dirección 127.0.0.1 solo funciona en el ordenador local.

## Descripción breve para la entrega

VecinoIA es un portal inteligente para comunidades de propietarios basado en la propuesta de ANPARA. Reúne avisos, documentos, incidencias y un asistente de IA que utiliza fuentes publicadas por administración y muestra sus citas. Incorpora consejos, ayudas y servicios energéticos y técnicos con un canal privado atendido por Gestión VecinoIA. La demostración utiliza dos comunidades ficticias y separa permisos de vecinos, administradores y gestión. Es una base local funcional para evolucionar hacia una aplicación profesional.
