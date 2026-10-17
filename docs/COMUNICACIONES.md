# Resumen de comunicaciones y limpieza

17 de octubre de 2026. Administración muestra recuentos de Pendientes, En curso y Terminadas para las consultas e incidencias de la comunidad seleccionada. El desplegable Mostrar comunicaciones filtra la bandeja por esos estados. El estado visual En curso corresponde a En revisión en los datos y Terminada a Resuelta; se conservan compatibilidad e historial.

Eliminar completadas muestra cuántas consultas terminadas se eliminarán de esa comunidad y está desactivado cuando no hay ninguna. El borrado es efectivo, también en la vista de los vecinos; el texto junto al botón indica ese alcance. No se borran pendientes, en curso, otras comunidades, documentos, avisos, fichas ni consultas particulares. No es un archivo recuperable desde el panel.

La API usa POST /api/tickets/clear-completed?community=... y exige sesión de administración o gestión, permisos sobre la comunidad, origen permitido y CSRF. El servidor selecciona el estado terminal; el cliente no puede ampliar el borrado enviando otro estado. Se guarda la modificación en el almacenamiento persistente.

El usuario solicita además vaciar de nuevo todos los ensayos, tanto comunitarios como particulares, de la web pública. Antes de la limpieza se respaldan las dos consultas comunitarias y dos particulares. Se utiliza una operación puntual con marcador y backup diferentes del día anterior. No afecta a la copia local de desarrollo. Tras desplegar `73e3633`, se confirma reinicio y ambas bandejas públicas quedan a cero, conservando identificadores de documentos y fichas en las dos comunidades. Se retira la llamada puntual del arranque; el botón permanente solo elimina comunitarias terminadas.

Pruebas locales: veintitrés aprobadas, incluida autorización, CSRF, preservación de activas, privacidad del canal particular, separación por comunidad, repetición sin registros y persistencia tras reiniciar. Recorrido Edge: recuentos, filtros, marcar Terminada, eliminar, mantener pendientes y otras comunidades, recarga y móvil a 390 px sin desbordamiento ni errores JavaScript.
