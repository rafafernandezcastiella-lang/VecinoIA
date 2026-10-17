# Avisos ordinarios y urgentes

17 de octubre de 2026. Al publicar, administración y gestión eligen Ordinario o Urgente. No se asigna urgencia automáticamente por tema: horarios, empresa de mantenimiento, reunión o incidencias pueden clasificarse según el criterio del administrador. Los avisos anteriores sin tipo se tratan como ordinarios.

## Presentación y vigencia

Un ordinario se muestra en las tarjetas del portal. Un urgente activo se muestra además en un banner anterior al contenido, en todas las secciones de la comunidad. Lleva etiqueta visible, título, mensaje y una animación suave de énfasis, sin ocultar texto ni parpadeos rápidos. Respeta prefers-reduced-motion. El vecino no lo descarta por su cuenta; administración puede Finalizar aviso urgente y así retirar el banner conservando la ficha como finalizada.

El portal del vecino visible consulta actualizaciones cada treinta segundos y al volver a la pestaña. Actualiza el área urgente sin rehacer formularios ni borrar textos sin enviar. Se mantienen los controles de comunidad y sesión. No es una notificación push del sistema operativo ni un aviso con entrega garantizada en tiempo real.

## Correo: simulación elegida por el usuario

El usuario eligió expresamente «Prepararlo para la demo, sin enviar correos reales». Al publicar un urgente se guarda un registro de simulación con fecha, número de cuentas de vecinos asignadas a esa comunidad y cero correos reales enviados. Los ordinarios no generan ese registro. El número corresponde a cuentas registradas, no al número de viviendas: Los Olivos tiene dos cuentas de vecinos ficticios y Plaza Mayor una.

El administrador ve el registro y puede desplegar un ejemplo de asunto y contenido del correo. No se llama a ningún proveedor, no hay direcciones reales, cola real de correo, SMTP ni garantía de recepción. La publicación del banner funciona aunque no haya cuentas destinatarias. Los metadatos de simulación no se exponen a vecinos ni otras comunidades.

Para enviar correo real después del concurso habrá que configurar proveedor y remitente autorizado, direcciones válidas y permisos de uso, seguimiento por destinatario, reintentos y estados reales. No se presenta esta integración como disponible.

## Validación

Veinticuatro pruebas locales aprobadas: permisos de publicación y finalización, CSRF, aislamiento por comunidad, clasificación válida, ordinario sin correo, urgente con cuenta correcta de destinatarios simulados, historial finalizado y persistencia. Prueba Edge con contextos separados: publicación ordinaria, urgente, simulación para dos vecinos, actualización del banner sin perder texto en un formulario, ausencia en otra comunidad, finalización, móvil a 390 px y movimiento reducido. Sin errores JavaScript. Los ensayos usan almacenamiento temporal y no añaden avisos a la web pública.
