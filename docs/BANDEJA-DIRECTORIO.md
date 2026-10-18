# Campana, mensajes sin leer y directorio

18 de octubre de 2026. Administración y Gestión VecinoIA tienen una campana en la barra superior. Cuenta mensajes no abiertos por ese usuario en todas sus comunidades autorizadas, independientemente de la comunidad seleccionada en ese momento.

## Bandeja y lectura

La bandeja incluye consultas comunitarias y solicitudes de documentos. Gestión VecinoIA incluye además consultas particulares de servicios; el administrador ordinario no las recibe ni ve sus avisos de correo. La lectura es por usuario: que un administrador abra un mensaje no lo marca leído para otro gestor.

La campana abre Bandeja de mensajes, con filtro Sin leer/Todos. Ver mensaje registra lectura y abre la comunidad y sección del mensaje. Si se responde una consulta directamente desde administración o gestión también se marca leída para quien responde. Las lecturas se guardan en el volumen y resisten reinicios. Las comunicaciones eliminadas ya no contribuyen al recuento. Las solicitudes de documento permiten saltar a la tarjeta correspondiente.

La campana consulta novedades cada treinta segundos y al volver a la pestaña. Actualiza su recuento sin reconstruir formularios abiertos. No es una notificación push del sistema operativo.

## Correo de aviso

Se mantiene la preferencia expresa de demostración sin correos reales. Cada nueva comunicación del vecino registra una notificación simulada para el personal autorizado de esa comunidad. Las particulares de servicios solo simulan aviso para gestión. La bandeja indica cuántas notificaciones simuladas se han registrado para ese usuario y que no se han enviado correos reales. No se configura SMTP, remitente ni proveedor de correo en esta versión.

## Directorio por comunidad

Administración y gestión pueden añadir y editar contactos con Piso, Letra, Nombre, Apellidos, Correo electrónico y Teléfono. El campo opcional Cuenta VecinoIA vincula un contacto con un usuario residente ya existente en esa comunidad. No crea cuentas nuevas y no permite vincular roles de personal, cuentas de otra comunidad ni duplicar una vinculación en la misma comunidad.

El nombre y piso de contactos vinculados se utilizan en el selector de destinatarios de avisos individuales. Los contactos sin cuenta se guardan en el directorio pero no reciben mensajes de portal hasta que exista una cuenta vinculada. El máximo de la demo es de quinientos contactos por comunidad.

Los residentes no reciben el directorio, los teléfonos ni los correos en su estado de API. Solo personal autorizado accede y los cambios exigen CSRF y permisos de comunidad. Se incluyen registros ficticios con apellidos Ejemplo y correos example.com; el formulario pide usar únicamente datos ficticios para el concurso. No hay envío de correos reales a esas direcciones.

## Vista del vecino

Se oculta todo el bloque del selector de comunidades, incluida su etiqueta. La comunidad activa sigue identificándose en la barra superior. El servidor mantiene la autorización por comunidades; ocultar el selector no sustituye esos controles. Las cuentas actuales de vecinos de la demo tienen una comunidad asignada.

## Validación

Veintinueve pruebas automatizadas aprobadas. Nuevas pruebas: recuento por usuario y comunidad, separación del canal privado de servicios, CSRF de lectura, lectura persistente y simulación de correo, validación del directorio, vinculación y privacidad, modificación y persistencia sin crear cuentas. Edge: campana se actualiza al enviar consulta, baja al abrir, gestor recibe servicios que administrador no ve, altas/ediciones del directorio, recarga y cambio de comunidad, móvil a 390 px sin desbordamiento ni errores JavaScript. Se prueba con datos temporales sin crear consultas o contactos de ensayo en la web pública.

## Campana del vecino — 18 de octubre de 2026

La campana abre Tus respuestas y avisos: respuestas de Administración a consultas comunitarias, respuestas de Gestión a servicios privados y avisos particulares dirigidos al usuario. Ver respuesta/Ver aviso registra lectura persistente y abre el contenido original. Una respuesta modificada vuelve a estar sin leer; guardar solo el estado o la misma respuesta no duplica avisos. Las respuestas previas también aparecen, sin atribuirles un correo que no se registró. Las consultas eliminadas dejan de contribuir al recuento.

Las nuevas respuestas y avisos particulares registran correo simulado con cero envíos. No hay transporte de correo real. Actualización cada treinta segundos y al volver a la pestaña, sin borrar formularios. La lectura desde Avisos particulares actualiza también la campana. Un identificador de revisión evita marcar leída una respuesta que acaba de cambiar. La API exige rol de vecino, destinatario autorizado y CSRF para lectura.
