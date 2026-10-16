# Solicitud y envío manual de documentos

Implementado el 13 de octubre de 2026. Modalidad elegida por el usuario: preparar el mensaje en el panel y abrir correo o WhatsApp para enviarlo manualmente.

## Recorrido del vecino

1. Identificarse y entrar en Documentos.
2. Descargar directamente el PDF o pulsar Solicitar envío.
3. Elegir correo electrónico o WhatsApp e indicar un destino ficticio durante la demo.
4. Registrar la solicitud y consultar su estado en Mis solicitudes de documentos.

## Recorrido del administrador o Gestión VecinoIA

1. Identificarse y seleccionar una comunidad autorizada.
2. Entrar en Envío de documentos.
3. Revisar el documento, vecino y destino de la solicitud.
4. Abrir correo o WhatsApp con un mensaje preparado, o copiar el mensaje.
5. Realizar el envío en la aplicación externa.
6. Marcar que se ha realizado y registrar la confirmación manual.

El portal no envía mensajes automáticamente. Abrir correo o WhatsApp no cambia el estado. «Envío confirmado por gestor» expresa una declaración manual, no un comprobante de recepción o entrega del proveedor.

## Enlace y permisos

El mensaje lleva un enlace al documento dentro del portal. Si el destinatario no tiene sesión, debe identificarse; solo puede abrirlo y descargarlo si su usuario tiene acceso a esa comunidad. El enlace no incluye una contraseña o token de sesión ni convierte el documento en público.

La descarga PDF se valida en servidor y la solicitud se asocia al vecino identificado. El vecino no ve destinos ni solicitudes de otros vecinos. Administradores y gestión ven las solicitudes de sus comunidades autorizadas.

## Estado local y límites

La dirección actual es local al ordenador. Los enlaces preparados todavía no sirven para un destinatario en otro dispositivo; cuando se publique el portal utilizarán su dominio público. Es necesario tener configurado un cliente de correo para abrir enlaces mailto o disponer de WhatsApp para completar el envío por ese canal.

El mensaje contiene un enlace, no un archivo adjunto. Durante el hackatón solo se usan datos y destinos ficticios. Para documentos precargados se genera un PDF de texto; para documentos subidos y publicados se descarga el archivo original. Ver CARGA-DOCUMENTOS.md. Si el documento se retira, se bloquean el acceso del vecino y la preparación de nuevos envíos.

Las solicitudes y confirmaciones se guardan en `data/demo.json`. No se han enviado mensajes reales durante la implementación o las pruebas.
