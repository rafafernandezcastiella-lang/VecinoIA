# Historial de instrucciones — VecinoIA

Inicio del registro: 13 de octubre de 2026. Se conservará este archivo y se trasladará al Google Doc de prompts para la entrega. No es una exportación completa del chat: registra las instrucciones visibles y un contexto importado identificado por separado. Será necesario conservar/exportar la conversación completa para acreditar las instrucciones y respuestas sin omisiones.

## 001 — Inicio

Texto del usuario:

> Acabo de crear el proyecto VecinoIA y la carpeta de confianza en el escritorio de mi ordenador. Guiame paso a paso lo que tenemos que hacer y calcula los tiempos para llegar a entregar el proyecto.

Acción: inspección de carpeta; inicialmente faltaba contexto sobre la finalidad de VecinoIA.

## 002 — Contexto aportado

El usuario adjuntó `Texto pegado.txt`, una conversación anterior con el resumen de las bases y la definición del proyecto. Se conserva literalmente en `docs/CONTEXTO-APORTADO.txt`. Es contexto de planificación, no código ni archivos de un prototipo anterior. Las afirmaciones de aquella conversación sobre las bases todavía no se han contrastado con el PDF original.

Decisiones extraídas: proyecto nuevo, dos comunidades ficticias, asistente con fuentes, portal, consultas, servicios y administración; desarrollo con Codex; despliegue posterior; inscripción ya realizada; utilidad futura para comunidades.

## 003 — Autorización de inicio

Texto del usuario:

> Adelante

Acción: definición del alcance y arquitectura, estructura nueva y primera base local de la aplicación. Se implementan dos comunidades ficticias, navegación adaptable, FAQ con fuente y derivación a formulario, consultas persistentes, catálogo de solicitudes y administración demostrativa. La autenticación y la integración de IA generativa todavía no están implementadas. Se añaden comprobaciones de integración de separación de comunidades, validación, persistencia y fuentes.

Herramienta de desarrollo: Codex. No se ha utilizado Sites para crear ni alojar la aplicación.

## 004 — Identidad de ANPARA y fotografía de fondo

Texto del usuario:

> Tenemos que mejorar esa pagina web. Quiero que uses los colores de la identidad visual de ANPARA. LA web, de fondo, será una foto de la comunidad en cuestion, para el Hackaton inventate una.

Referencia aportada: `ANPARA MANUAL DE IDENTIDAD.pdf`, leído desde la ubicación indicada por el usuario. Se utilizaron la paleta de la página 5 y los criterios visuales aplicables; el documento se trató como referencia de diseño.

Acción: nueva capa visual corporativa, navegación azul profundo, acciones azul #0072CE, paneles blancos, fondo fotográfico configurable por comunidad y dos fotografías ficticias generadas con la herramienta integrada imagegen. Prompts completos y rutas en `docs/IDENTIDAD-VISUAL.md`. Se comprobó el resultado en navegador de escritorio y móvil.

## 005 — Requisitos ampliados en conversación de voz

Registro resumido, no transcripción literal completa: el usuario confirma acceso individual conforme al rol y comunidades autorizadas; carga de documentos por el administrador o por gestión VecinoIA; consultas particulares que incluyan luz, gas y futuras categorías; asistente animado tipo avatar en una fase posterior. Se documentó el alcance pendiente en `EVOLUCION.md`, sin implementar aún esas funciones ni crear el avatar. Conservar la conversación de voz junto al resto del historial para completar la evidencia de instrucciones.

## 006 — Implementación del acceso

Texto del usuario:

> Cual es el siguiente paso?

Se propuso implementar usuarios ficticios y permisos en servidor antes de separar consultas y cargar documentos.

Respuesta del usuario:

> ok

Acción: pantalla de acceso y cierre de sesión, cuentas ficticias de vecino/administrador/gestión, contraseñas derivadas con scrypt, sesiones en cookie HttpOnly, validación de comunidad y autor en servidor, protección CSRF y límite de intentos. Se elimina el selector de roles. Se verifican permisos con pruebas de integración y el recorrido de acceso en navegador de escritorio y móvil. No se implementan todavía la bandeja de servicios independiente o la carga de documentos.

## 007 — Envío de documentos

Texto del usuario:

> Otra funcionalidad que quiero añadir, es poder enviar al vecino los documentos que solicite, bien por mail o bien por whats ap

Se preguntó por la modalidad manual o automática. Elección del usuario:

> Desde el panel: preparar el mensaje con un enlace al documento y abrir correo o WhatsApp para enviarlo.

Acción: descarga PDF protegida; solicitudes por vecino, comunidad y canal; bandeja para administración/gestión; mensajes de correo o WhatsApp preparados con enlace al portal; confirmación manual separada de la entrega real. El destinatario debe identificarse y tener acceso al documento. No se enviaron mensajes reales. Se probaron privacidad, permisos, persistencia, validación de canales y el recorrido en navegador con datos temporales ficticios.

## 008 — Separación de consultas particulares

Tras revisar los usuarios y preguntar «Vale, como seguimos?», se propuso separar consultas comunitarias y particulares con una bandeja privada de Gestión VecinoIA. Autorización del usuario:

> Ok, vamos

Acción: categorías independientes Luz y Gas, Seguros, Mantenimiento y Otras consultas; formulario particular y seguimiento privado; bandeja de Gestión VecinoIA con solicitudes de sus comunidades y filtro por estado; respuestas privadas. El servidor rechaza el acceso del administrador y de otros vecinos. Se migran las solicitudes antiguas del catálogo sin perder contenido. Se verificó persistencia y privacidad con pruebas de integración y un recorrido completo en navegador con almacenamiento temporal ficticio.

## 009 — Base de ANPARA para el concurso

14 de octubre de 2026. Texto del usuario:

> Usar la propuesta de ANPARA como base de VecinoIA para el concurso: portal inteligente para comunidades, IA supervisada por el administrador, incidencias, documentos y espacio de consejos, ayudas y servicios energéticos y técnicos. Después, evolucionar hacia una aplicación profesional

Acción: documentación de una base única para la entrega del concurso y evolución posterior, actualización del alcance y del calendario restante. Se aclara que la supervisión de IA se refiere al control de fuentes publicadas y preguntas derivadas. Se mantiene la separación entre administración comunitaria y atención particular de Gestión VecinoIA. Esta actualización de planificación no implementa carga de documentos, IA generativa o contenido editorial.

## 010 — Carga y supervisión documental

14 de octubre de 2026. Tras proponer la carga documental y control de publicación como siguiente paso, el usuario indica:

> Venga, siguiente paso

Acción: carga de PDF con texto, Word DOCX y TXT; procesamiento local con límites; borradores visibles solo para administración/gestión de la comunidad; revisión y publicación explícitas; retirada de fuentes; descargas originales protegidas; exclusión de borradores y retirados de nuevas respuestas del asistente y del envío de documentos. Se instalan PDF.js y Mammoth como dependencias declaradas. Se añaden ejemplos ficticios y pruebas de permisos, formatos, errores y persistencia. La búsqueda documental actual cita fragmentos literales; aún no se integra IA generativa.

## 011 — Equivalencia de gym y gimnasio

El usuario detecta que la pregunta sobre «gym» no encuentra la información publicada sobre «gimnasio».

Acción: normalizar ambas variantes en preguntas y fuentes, respetando mayúsculas/minúsculas y conservando intacto el fragmento citado. Se prueban variantes de pregunta, fuente abreviada, separación de comunidades y retirada de publicación. La equivalencia es explícita y no supone comprensión semántica general o integración de IA generativa.

## 012 — Preparación y activación de IA

Ante «siguiente paso», se prepara una integración de IA mediante API Responses de OpenAI, con documentos publicados de la comunidad, salida estructurada y citas verificadas. El usuario solicita guía para configurar la cuenta y la clave; se crea una plantilla de configuración local excluida de Git. No se registra el valor de ninguna clave.

El 15 de octubre el usuario indica «clave guardada». Se confirma únicamente su presencia y se prueba una consulta real con información ficticia de la piscina. El proveedor devuelve HTTP 429 de cuota insuficiente. La activación real queda pendiente de que el usuario revise saldo/facturación y límites del proyecto; no se afirma que exista una respuesta generativa real validada.

## 013 — Verificación tras recarga de créditos

16 de octubre de 2026. El usuario comunica la recarga y, tras recibir instrucciones para configurar `.env`, indica «guardado». Se comprueba la conexión real sin exponer la clave: HTTP 200, respuesta de piscina con fuente validada y derivación ante una pregunta sin soporte sobre saldo bancario. El servidor local confirma modo generativo configurado. Se actualiza la documentación de activación y validación.

## 014 — Espacio de consejos, ayudas y servicios

16 de octubre de 2026. Tras confirmar el funcionamiento de la IA, el usuario acepta completar esta sección. Se añaden fichas por comunidad con ejemplos ficticios, filtros por sección, creación y edición de borradores, publicación con revisión y retirada por administración o gestión. Los vecinos solo ven publicaciones autorizadas y pueden abrir una consulta privada con la categoría correspondiente. Las fichas no se añaden automáticamente a las fuentes del asistente. Validación de permisos y persistencia más recorrido completo en navegador de escritorio y móvil.


## 015 — Preparación de demostración y entrega

16 de octubre de 2026. El usuario indica «ya» tras probar la sección. Se prepara un guion de cuatro minutos y medio y se actualizan estado, pendientes y estimaciones. Bases originales aún pendientes de contraste. No se afirma haber grabado, publicado ni entregado el proyecto.

## 016 — Preparación para publicar y creación de cuentas

16 de octubre de 2026. El usuario acepta continuar y aclara que no tiene GitHub ni alojamiento, solicitando guía. Se contrasta el PDF original local de las bases y se confirma cierre y entregables. Se prepara DATA_DIR para disco persistente, healthcheck sin secretos, plantilla Docker aún sin construir y exclusiones de publicación. Veintiuna pruebas aprobadas; escaneo preventivo de candidatos a repositorio sin imprimir valores de claves. No se crean cuentas, contratan servicios ni publica código todavía. El siguiente paso del usuario es crear y verificar una cuenta gratuita de GitHub.

## 017 — Primera subida a GitHub

16 de octubre de 2026. El usuario confirma la cuenta `rafafernandezcastiella-lang`, crea el repositorio VecinoIA siguiendo las instrucciones de visibilidad privada y autoriza Git Credential Manager. Se revisan los archivos preparados y se excluyen claves, datos locales, cachés y contexto pegado. Se crea el primer commit `342b0c4` sin reconstruir ni falsear commits anteriores y se sube la rama `codex/hackathon`. La referencia remota coincide con la local. Se actualiza la documentación; el alojamiento público sigue pendiente.

## 018 — Primera comprobación pública en Railway

16 de octubre de 2026. El usuario configura variables, comunica creación de volumen y facilita `https://vecinoia-production.up.railway.app`. Portada y healthcheck responden HTTP 200; archivos sensibles no son accesibles por HTTP. La prueba inicial de login recibe 403 por comparación HTTP/HTTPS detrás del proxy. Se corrige el origen permitido en producción para usar HTTPS, sin confiar en cabeceras de protocolo enviadas por el cliente. Se comprueba aceptación de origen HTTPS del mismo host y rechazo de otros orígenes y HTTP en producción. Pendiente nueva comprobación pública tras desplegar la corrección.

Tras el despliegue de `8e40286`, se confirman login de tres roles, separación de comunidades, canal particular inaccesible para administración y respuesta de IA de piscina con fuente desde la URL pública. Las sesiones se cierran sin crear datos de contenido. Veintiuna pruebas locales aprobadas tras la corrección. La conservación pública de archivos después de reiniciar sigue pendiente de prueba.

## 019 — Conservación documental en Railway

16 de octubre de 2026. El usuario acepta continuar con la prueba de persistencia. Se carga y publica en la web pública el ejemplo ficticio de normas del gimnasio, tras revisar el texto procesado; se verifica descarga idéntica al original. Se prepara un nuevo despliegue para comprobar conservación del registro, publicación y bytes del archivo después de reiniciar. No se alteran documentos anteriores del usuario.

Resultado: se observa reinicio por revocación de sesión; el registro publicado no se conserva después. Prueba fallida. Se solicita revisión visual del volumen y de su asociación/ruta en Railway. No se presenta la persistencia como conseguida. El resultado se registra localmente sin otro despliegue hasta corregir la configuración.

La captura posterior muestra `vecinoia-volume` asociado y un cambio pendiente. Se indica aplicar Deploy; el usuario confirma «online». Se inicia una segunda prueba con publicación y descarga idéntica del ejemplo del gimnasio, antes de otro despliegue controlado. El fallo anterior se conserva como historial, no como resultado de esta segunda prueba.

Segunda prueba superada tras despliegue `7315a86`: revocación de sesión confirma reinicio y una nueva sesión encuentra el mismo documento publicado; los bytes descargados conservan el mismo SHA-256. Se actualiza el estado de la documentación. El ejemplo queda disponible para el ensayo. El resultado no implica validación de backups ni continuidad del plan durante toda la evaluación.
