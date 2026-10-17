# Contacto individual con vecinos

17 de octubre de 2026. En la portada del administrador se elimina la tarjeta «¿Necesitas hablar con el administrador?» y el botón del bloque principal «Hablar con el administrador». Para vecinos se conservan. Administración y gestión autorizadas encuentran una tarjeta y entrada de menú «Contacto con los vecinos».

El formulario ofrece solo cuentas de vecinos de la comunidad seleccionada y exige destinatario, asunto y mensaje. El servidor valida rol, comunidad, destinatario y CSRF; deriva el remitente de la sesión, sin admitir suplantación desde el formulario. El aviso se guarda en la colección neighborMessages y llega al portal del destinatario, no por correo ni WhatsApp.

El vecino tiene «Avisos particulares», separado de «Consultas particulares» de servicios. Solo el destinatario y el personal autorizado de la comunidad ven ese aviso. Otros vecinos no acceden. Una señal de mensajes nuevos aparece al iniciar sesión y se actualiza con la comprobación periódica del portal sin borrar formularios. El destinatario puede marcarlo como leído; administración puede actualizar su bandeja para comprobarlo. No implica confirmación de recepción de un correo externo ni lectura automática.

Las consultas privadas de servicios siguen siendo inaccesibles al administrador ordinario. El nuevo canal no las incorpora. El listado de destinatarios, sin contraseñas ni datos de autenticación, solo se entrega al personal autorizado.

Veintiséis pruebas locales aprobadas. Nueva prueba: remitente real, destinatario de comunidad válida, rechazo de vecino/CSRF/comunidad incorrecta, ausencia del listado para residentes, aislamiento entre destinatarios, marcado de lectura solo por el destinatario, idempotencia y persistencia tras reinicio. Edge comprueba los elementos retirados para personal y conservados para vecinos, envío, aviso nuevo sin perder texto escrito, lectura, aislamiento, cambio de comunidad y móvil a 390 px. Pruebas con almacenamiento temporal: no se envían mensajes de ensayo a usuarios de la web pública.
