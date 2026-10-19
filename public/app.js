const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const date = value => new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
let communityId = 'olivos', state, page = 'home', role = 'resident', chat = [], pendingQuestion = '', serviceCategory = 'General';
let loading = false;
let user = null, csrfToken = '';
let requestedDocument = '';
let privateRequests = [], privateCategory = 'Luz', privateFilter = 'Todas';
let adviceFilter = 'Todas', editingAdvice = '';
let adminFilter = 'Todas';
let stateVersion = 0;
let staffInboxData = { items: [], unreadCount: 0, simulatedEmailCount: 0 }, editingResident = '';
let staffInboxFilter = 'unread';
const communityStatusLabel = status => ({ Pendiente: 'Pendiente', 'En revisión': 'En curso', Resuelta: 'Terminada' }[status] || status);
const privateCategories = ['Luz', 'Gas', 'Seguros', 'Mantenimiento', 'Otras consultas'];
const incomingLink = new URLSearchParams(location.search);
const roleNames = { resident: 'Vecino', admin: 'Administrador', manager: 'Gestión VecinoIA' };

function notice(message) { $('#notice').textContent = message; $('#notice').classList.add('visible'); clearTimeout(notice.timer); notice.timer = setTimeout(() => $('#notice').classList.remove('visible'), 5500); }
async function api(path, method = 'GET', body, id = communityId) {
  const multipart = body instanceof FormData;
  const response = await fetch(`/api/${path}?community=${encodeURIComponent(id)}`, { method, headers: { ...(multipart ? {} : { 'Content-Type': 'application/json' }), 'X-CSRF-Token': csrfToken }, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') showLogin();
    throw new Error(data.error || 'No se pudo completar la operación');
  }
  return data;
}
function showLogin() {
  staffInboxData = { items: [], unreadCount: 0, simulatedEmailCount: 0 }; editingResident = ''; $('#staff-inbox-slot').replaceChildren();
  adminFilter = 'Todas';
  adviceFilter = 'Todas'; editingAdvice = '';
  privateRequests = []; privateCategory = 'Luz'; privateFilter = 'Todas';
  user = null; csrfToken = ''; chat = []; pendingQuestion = ''; serviceCategory = 'General'; requestedDocument = ''; state = undefined; page = 'home'; loading = false;
  $('.layout').hidden = true; $('#login-screen').hidden = false;
  $('#content').replaceChildren(); $('#nav').replaceChildren(); $('#community').replaceChildren();
  $('#user-name').textContent = ''; $('#user-role').textContent = ''; $('#session-role').textContent = '';
  document.documentElement.style.setProperty('--community-photo', 'url("/images/los-olivos.png")');
  document.title = 'VecinoIA · Accede a tu portal';
  $('#password').value = '';
}
async function enterPortal(session) {
  user = session.user; csrfToken = session.csrfToken; role = user.role;
  const list = await api('communities');
  if (!list.length) throw new Error('Tu usuario todavía no tiene comunidades asignadas');
  communityId = list[0].id;
  const linkedCommunity = incomingLink.get('community');
  const linkAllowed = linkedCommunity && list.some(c => c.id === linkedCommunity);
  if (linkAllowed) communityId = linkedCommunity;
  $('#community').innerHTML = list.map(c => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join('');
  $('#community').value = communityId;
  $('#community').disabled = list.length === 1;
  $('.community-switch').hidden = role === 'resident';
  $('#user-name').textContent = user.name; $('#user-role').textContent = roleNames[role];
  $('#session-role').textContent = roleNames[role]; $('#user-avatar').textContent = user.name.slice(0, 1);
  $('#login-screen').hidden = true; $('.layout').hidden = false;
  $('#password').value = ''; page = 'home'; await load();
  if (incomingLink.has('document') && user && state) {
    const doc = linkAllowed && state.documents.find(d => d.id === incomingLink.get('document'));
    if (doc) { page = 'documents'; render(); document.getElementById(`document-${doc.id}`)?.querySelector('details')?.setAttribute('open', ''); }
    else notice('Tu cuenta no tiene acceso al documento solicitado o el documento no está disponible.');
  }
}
async function load() {
  loading = true;
  $('#content').innerHTML = '<p>Cargando tu comunidad…</p>';
  try {
    const [next, requests, inbox] = await Promise.all([api('state'), role === 'admin' ? Promise.resolve([]) : api('service-requests'), api(role === 'resident' ? 'resident-inbox' : 'staff-inbox')]);
    state = next; privateRequests = requests; if(inbox)staffInboxData=inbox; loading = false; render();
  }
  catch (error) { loading = false; $('#content').innerHTML = '<div class="empty">No se pudo cargar la comunidad. <button class="btn" data-action="retry">Reintentar</button></div>'; notice(error.message); }
}
const heading = (title, description) => `<div class="heading"><h1>${title}</h1><p class="lead">${description}</p></div>`;
const dismissAnnouncementControl = a => role === 'resident' ? `<form class="dismiss-announcement-form" data-id="${escape(a.id)}"><button class="announcement-dismiss" type="submit">quitar anuncio</button></form>` : '';
const announcement = a => `<article class="card ${a.urgency === 'urgent' ? 'urgent-card' : ''}"><span class="tag">${a.urgency === 'urgent' ? (a.active === false ? 'Urgente · Finalizado' : 'Aviso urgente') : 'Aviso ordinario'}</span><div class="meta">${escape(a.category)} · ${date(a.date)}</div><h3>${escape(a.title)}</h3><p class="announcement-body">${escape(a.body)}</p>${dismissAnnouncementControl(a)}</article>`;
function announcementList() { return state.announcements.length ? state.announcements.map(announcement).join('') : '<div class="empty">No tienes anuncios pendientes en esta comunidad.</div>'; }
function urgentBanners() {
  if (page !== 'home') return '';
  const urgent = state.announcements.filter(a => a.urgency === 'urgent' && a.active !== false);
  return `<section id="urgent-notices" class="urgent-announcements" aria-label="Avisos urgentes de tu comunidad" ${urgent.length ? '' : 'hidden'}>${urgent.map(a => `<article class="urgent-banner"><div class="urgent-label"><span class="urgent-dot" aria-hidden="true"></span>AVISO URGENTE · ${date(a.date)}</div><h2>${escape(a.title)}</h2><p class="announcement-body">${escape(a.body)}</p><small>Comunicado por la administración de ${escape(state.name)}</small>${dismissAnnouncementControl(a)}</article>`).join('')}</section>`;
}
function homeContactCard() {
  return role === 'resident' ? `<div class="card"><h3>¿Necesitas hablar con el administrador?</h3><p>Envía tu consulta y sigue la respuesta desde aquí.</p><br><button class="btn secondary" data-page="tickets">Crear una consulta</button></div><div class="card"><h3>Avisos particulares del administrador</h3><p>Consulta los mensajes que la administración te ha dirigido de forma individual.</p><button class="btn secondary" data-page="messages">Ver mis avisos particulares</button></div>` : `<div class="card"><h3>Contacto con los vecinos</h3><p>Elige un vecino de esta comunidad y envíale un aviso particular a su portal.</p><br><button class="btn secondary" data-page="neighborContact">Contactar con un vecino</button></div>`;
}
function home() {
  return `<div class="welcome"><div class="community-plaque"><span class="plaque-icon" aria-hidden="true">⌂</span><div><small>BIENVENIDO A CASA</small><strong>${escape(state.name)}</strong><span>${state.homes} viviendas · Comunidad de demostración</span></div></div>${heading('Tu comunidad, más cerca.', escape(state.subtitle))}<section class="hero"><div><div class="eyebrow">MENOS ESPERAS, MÁS RESPUESTAS</div><h2>Una duda menos.<br>Un día más sencillo.</h2><p>Consulta la información de tu comunidad y encuentra respuestas con su documento de origen.</p><div class="hero-actions"><button class="btn" data-page="assistant">Preguntar al asistente ↗</button>${role === 'resident' ? '<button class="btn photo-button" data-page="tickets">Hablar con el administrador</button>' : ''}</div></div></section></div>
    <div class="stats"><div class="stat"><strong id="home-announcement-count">${state.announcements.length}</strong><span>Avisos de la comunidad</span></div><div class="stat"><strong>${state.documents.length}</strong><span>Documentos disponibles</span></div><div class="stat"><strong>${state.tickets.filter(t => t.status !== 'Resuelta').length}</strong><span>Consultas abiertas</span></div></div>
    <div class="columns"><section><div class="section-head"><h2>Lo que pasa en tu comunidad</h2></div><div id="home-announcements-list">${announcementList()}</div></section><section><div class="card"><span class="tag">PRÓXIMA REUNIÓN</span><div class="meeting-date">${date(state.meeting.date)}</div><h3>${escape(state.meeting.title)}</h3><p>${escape(state.meeting.time)} h · ${escape(state.meeting.place)}</p><p>Consulta la convocatoria en los documentos de tu comunidad.</p><br><button class="btn secondary" data-page="documents">Ver documentación</button></div>${homeContactCard()}</section></div>`;
}
function neighborInboxNotice() {
  const count = role === 'resident' ? (state.neighborMessages || []).filter(m => !m.readAt).length : 0;
  return `<div id="neighbor-inbox-notice" class="neighbor-inbox-notice" ${count ? '' : 'hidden'}><strong>Tienes ${count} ${count === 1 ? 'aviso particular nuevo' : 'avisos particulares nuevos'} de la administración.</strong><button class="btn secondary" data-page="messages">Ver avisos particulares</button></div>`;
}
function neighborMessageCards(staff) {
  const items = state.neighborMessages || [];
  return items.length ? items.map(m => `<article class="card neighbor-message"><span class="tag">${m.readAt ? 'Leído' : (staff ? 'Pendiente de lectura' : 'Nuevo')}</span><div class="meta">${date(m.createdAt)} · ${staff ? `Para: ${escape(m.recipient)}` : `De: ${escape(m.sender)}`}</div><h3>${escape(m.subject)}</h3><p class="announcement-body">${escape(m.message)}</p>${m.readAt ? `<div class="meta">Marcado como leído el ${date(m.readAt)}</div>` : !staff ? `<form class="read-neighbor-message-form form" data-id="${escape(m.id)}"><button class="btn secondary" type="submit">Marcar como leído</button></form>` : ''}</article>`).join('') : `<div class="empty">${staff ? 'Todavía no has enviado avisos particulares en esta comunidad.' : 'No tienes avisos particulares de la administración.'}</div>`;
}
function neighborContact() {
  const residents = state.residents || [];
  return heading('Contacto con los vecinos.', 'Envía un aviso particular al vecino que selecciones de tu comunidad.') + `<div class="note">El mensaje llegará a Avisos particulares en el portal del destinatario. Solo ese vecino y la administración autorizada de esta comunidad pueden consultarlo. Este canal no comparte las consultas particulares de servicios.</div><div class="columns"><section><form id="neighbor-contact-form" class="card form"><label>Vecino destinatario<select name="recipientId" required><option value="">Selecciona un vecino</option>${residents.map(r => `<option value="${escape(r.id)}">${escape(r.name)}</option>`).join('')}</select></label><label>Asunto<input name="subject" required maxlength="120" placeholder="Por ejemplo, recogida de una llave ficticia"></label><label>Mensaje<textarea name="message" required maxlength="2000" placeholder="Escribe el aviso dirigido solo a este vecino"></textarea></label><button class="btn" type="submit" ${residents.length ? '' : 'disabled'}>Enviar aviso particular</button>${residents.length ? '' : '<p>No hay vecinos asignados a esta comunidad.</p>'}</form></section><section><div class="section-head"><h2>Avisos particulares enviados</h2><button class="btn secondary" data-action="retry">Actualizar bandeja</button></div>${neighborMessageCards(true)}</section></div>`;
}
function messages() {
  return heading('Tus avisos particulares.', 'Comunicaciones que la administración ha dirigido únicamente a tu usuario.') + `<div class="note">Estos avisos no se publican en el tablón de la comunidad. Puedes registrar su lectura desde aquí.</div><div id="neighbor-message-list">${neighborMessageCards(false)}</div>`;
}
function staffBell() {
  return `<button class="btn secondary inbox-bell" data-page="${role === 'resident' ? 'residentMessages' : 'staffMessages'}" aria-label="${staffInboxData.unreadCount} mensajes sin leer"><span aria-hidden="true">🔔</span><span>Mensajes</span><span class="unread-badge ${staffInboxData.unreadCount ? 'has-unread' : ''}" aria-live="polite">${staffInboxData.unreadCount}</span></button>`;
}
function residentInboxCards() {
  return staffInboxData.items.length ? staffInboxData.items.map(i => `<article class="card"><span class="tag">${i.read ? 'Leído' : 'Sin leer'}</span><div class="meta">${escape(i.sender)} · ${date(i.createdAt)} · ${escape(i.communityName)}</div><h3>${escape(i.subject)}</h3>${i.email ? '<p class="meta">Aviso de correo simulado · No enviado</p>' : ''}<button class="btn secondary" data-open-resident="${escape(i.id)}" data-kind="${i.kind}">${i.kind === 'neighbor' ? 'Ver aviso' : 'Ver respuesta'}</button></article>`).join('') : '<div class="empty">Todavía no tienes respuestas ni avisos particulares.</div>';
}
function residentMessages() {
  return heading('Tus respuestas y avisos.', 'Comunicaciones dirigidas a ti por Administración y Gestión VecinoIA.') + '<div class="note">La campana cuenta las comunicaciones sin leer. Pulsa Ver respuesta o Ver aviso para abrirlas y marcarlas como leídas. Se actualiza automáticamente cada 30 segundos.</div><div class="email-simulation"><strong>Aviso por correo: simulación de la demo</strong><p>Las nuevas respuestas y avisos registran una notificación de correo para tu usuario. No se envían correos reales.</p></div><button class="btn secondary" data-action="retry">Actualizar bandeja</button><div id="resident-inbox-list">' + residentInboxCards() + '</div>';
}
async function openResidentCommunication(id,kind) {
  if(loading)return;
  const item=staffInboxData.items.find(i=>i.id===id&&i.kind===kind);if(!item)return;
  loading=true;stateVersion++;
  try {
    await api('resident-inbox/read','POST',{id,kind,notificationId:item.notificationId});
    communityId=item.communityId;$('#community').value=communityId;privateFilter='Todas';
    page=kind==='service'?'services':kind==='neighbor'?'messages':'tickets';
    await load();document.getElementById(`communication-${kind}-${id}`)?.scrollIntoView({block:'center'});
  } catch(error){notice(error.message);}finally{loading=false;}
}
function staffInboxCards() {
  const items=staffInboxData.items.filter(i=>staffInboxFilter==='all'||!i.read);
  const labels={ticket:'Consulta comunitaria',service:'Consulta particular de servicios',document:'Solicitud de documento'};
  return items.length?items.map(i=>`<article class="card"><span class="tag">${i.read?'Leído':'Sin leer'}</span><div class="meta">${labels[i.kind]} · ${escape(i.communityName)} · ${i.createdAt?date(i.createdAt):'Fecha sin registrar'}</div><h3>${escape(i.subject)}</h3><p>${escape(i.resident)}</p><button class="btn secondary" data-open-communication="${escape(i.id)}" data-kind="${i.kind}">Ver mensaje</button></article>`).join(''):'<div class="empty">No hay mensajes con este filtro.</div>';
}
function staffMessages() {
  return heading('Bandeja de mensajes.', 'Mensajes de los vecinos de todas tus comunidades autorizadas.')+`<div class="note">La campana cuenta los mensajes que tú todavía no has abierto. Las consultas particulares de servicios solo se muestran a Gestión VecinoIA.</div><div class="card inbox-filter"><label for="staff-inbox-filter">Mostrar</label><select id="staff-inbox-filter"><option value="unread" ${staffInboxFilter==='unread'?'selected':''}>Sin leer</option><option value="all" ${staffInboxFilter==='all'?'selected':''}>Todos</option></select><button class="btn secondary" data-action="retry">Actualizar bandeja</button></div><div class="email-simulation"><strong>Aviso por correo: simulación de la demo</strong><p>${staffInboxData.simulatedEmailCount} notificaciones de correo registradas para tu usuario. No se han enviado correos reales.</p></div><div id="staff-inbox-list">${staffInboxCards()}</div>`;
}
async function openCommunication(id,kind) {
  if(loading)return;const item=staffInboxData.items.find(i=>i.id===id&&i.kind===kind);if(!item)return;
  loading=true;stateVersion++;$('#community').disabled=true;
  try{await api('staff-inbox/read','POST',{id,kind});communityId=item.communityId;$('#community').value=communityId;adminFilter='Todas';privateFilter='Todas';page=kind==='service'?'serviceInbox':kind==='document'?'deliveries':'admin';await load();document.getElementById(`communication-${kind}-${id}`)?.scrollIntoView({block:'center'});}
  catch(error){notice(error.message);}finally{loading=false;$('#community').disabled=$('#community').options.length<=1;}
}
let refreshingStaff=false;
async function refreshStaffInbox() {
  if(!user||role==='resident'||loading||refreshingStaff||document.visibilityState!=='visible')return;
  const userId=user.id,version=stateVersion;refreshingStaff=true;
  try{const inbox=await api('staff-inbox');if(user?.id!==userId||loading||version!==stateVersion)return;staffInboxData=inbox;$('#staff-inbox-slot').innerHTML=staffBell();if(page==='staffMessages'&&$('#staff-inbox-list'))$('#staff-inbox-list').innerHTML=staffInboxCards();}catch{}finally{refreshingStaff=false;}
}
setInterval(refreshStaffInbox,30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshStaffInbox();});
function directory() {
  const contacts=state.residentDirectory||[],edit=contacts.find(r=>r.id===editingResident);
  const field=(name,label,max,type='text')=>`<label>${label}<input name="${name}" type="${type}" maxlength="${max}" required value="${escape(edit?.[name]||'')}"></label>`;
  return heading('Directorio de vecinos.', 'Datos de contacto de la comunidad seleccionada, accesibles solo para administración y gestión.')+`<div class="note">Para el concurso introduce únicamente datos ficticios. Guardar un contacto no crea una cuenta de acceso. Puedes vincularlo con una cuenta de vecino ya existente.</div><section class="card"><h2>${edit?'Editar contacto':'Añadir vecino'}</h2><form id="resident-directory-form" class="form" data-id="${escape(edit?.id||'')}"><div class="form-row">${field('floor','Piso',20)}${field('unit','Letra',20)}</div><div class="form-row">${field('firstName','Nombre',60)}${field('lastName','Apellidos',100)}</div><div class="form-row">${field('email','Correo electrónico',254,'email')}${field('phone','Teléfono',25,'tel')}</div><label>Cuenta VecinoIA vinculada (opcional)<select name="userId"><option value="">Sin cuenta vinculada</option>${(state.residents||[]).map(r=>`<option value="${escape(r.id)}" ${edit?.userId===r.id?'selected':''}>${escape(r.name)}</option>`).join('')}</select></label><button class="btn" type="submit">Guardar contacto</button>${edit?'<button class="btn secondary" type="button" data-action="cancel-resident-edit">Cancelar edición</button>':''}</form></section><section class="card"><h2>Vecinos de ${escape(state.name)} (${contacts.length})</h2>${contacts.length?`<div class="directory-table"><table><thead><tr><th>Piso</th><th>Letra</th><th>Nombre y apellidos</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>${contacts.map(r=>`<tr><td>${escape(r.floor)}</td><td>${escape(r.unit)}</td><td>${escape(r.firstName)} ${escape(r.lastName)}</td><td>${escape(r.email)}</td><td>${escape(r.phone)}</td><td><button class="btn secondary" data-edit-resident="${escape(r.id)}">Editar</button></td></tr>`).join('')}</tbody></table></div>`:'<p>No hay contactos en esta comunidad.</p>'}</section>`;
}
function assistant() {
  const configured = state.assistant?.configured;
  const mode = configured ? 'Modo IA configurado para las fuentes publicadas de tu comunidad. La pregunta y los fragmentos documentales se procesan mediante OpenAI. Si no hay soporte suficiente, puedes trasladar la pregunta al administrador.' : 'Modo búsqueda documental: la conexión de IA está pendiente de activación. Puedes consultar preguntas frecuentes y fragmentos publicados, o trasladar tu pregunta al administrador.';
  return heading('Una pregunta, una respuesta.', 'Encuentra información de tu comunidad y consulta de dónde procede.') + `<div class="chat-wrap"><div class="note">${mode}</div><div class="chat-log" aria-live="polite">${chat.length ? chat.map(chatBubble).join('') : '<div class="bubble"><small>ASISTENTE DE CONSULTA</small>Hola. Puedes preguntarme por la próxima junta, la cuota o las zonas comunes.</div>'}</div><div class="suggestions"><button data-question="¿Cuándo es la próxima junta?">Próxima junta</button><button data-question="¿Cuál es la cuota?">Cuota de la comunidad</button><button data-question="¿Hay piscina?">Zonas comunes</button></div><form id="ask-form" class="ask-row"><label class="skip" for="question">Tu pregunta</label><input id="question" name="question" placeholder="¿Qué quieres saber de tu comunidad?" maxlength="1000" required autocomplete="off"><button class="btn" type="submit">Consultar ↗</button></form></div>`;
}
function chatBubble(item) {
  const sources = item.sources?.length ? item.sources : item.source ? [item.source] : [];
  return `<div class="bubble ${item.user ? 'user' : ''}"><small>${item.user ? 'TÚ' : item.engine === 'openai' ? 'ASISTENTE CON IA' : 'BÚSQUEDA DOCUMENTAL'}</small>${escape(item.text)}${item.notice ? `<p class="assistant-notice">${escape(item.notice)}</p>` : ''}${sources.map(source => `<details><summary>Fuente: ${escape(source.title)}</summary><p>${escape(source.body)}</p></details>`).join('')}${item.unresolved ? '<br><button class="btn secondary" data-action="escalate">Enviar al administrador</button>' : ''}</div>`;
}
function documents() {
  const chosen = state.documents.find(doc => doc.id === requestedDocument);
  return heading('La información, a mano.', 'Consulta, descarga o solicita el envío de un documento de tu comunidad.') + state.documents.map(doc => `<article class="card" id="document-${escape(doc.id)}"><div class="meta">Actualizado el ${date(doc.updated)} · Documento demostrativo</div><details><summary>${escape(doc.title)}</summary><p>${escape(doc.body)}</p></details><div class="document-actions"><a class="btn secondary" href="/api/documents/${encodeURIComponent(doc.id)}/download?community=${encodeURIComponent(communityId)}" download>${doc.origin === 'upload' ? 'Descargar original' : 'Descargar PDF'}</a>${role === 'resident' ? `<button class="btn" data-document-request="${escape(doc.id)}">Solicitar envío</button>` : ''}</div></article>`).join('') + (chosen && role === 'resident' ? `<section class="card"><h2>Solicitar: ${escape(chosen.title)}</h2><p>El administrador preparará el mensaje con un enlace. Para abrirlo tendrás que identificarte en VecinoIA.</p><div class="note">Para esta demo utiliza solo un correo o teléfono ficticio. El portal aún es local: sus enlaces solo funcionan en este ordenador.</div><form id="document-request-form" class="form"><input type="hidden" name="documentId" value="${escape(chosen.id)}"><label>Canal de envío<select name="channel" id="delivery-channel"><option value="email">Correo electrónico</option><option value="whatsapp">WhatsApp</option></select></label><label id="destination-label">Correo electrónico ficticio<input name="destination" id="delivery-destination" type="email" placeholder="vecino@example.com" required maxlength="254"></label><button class="btn" type="submit">Registrar solicitud</button></form></section>` : '') + (role === 'resident' ? `<section><h2 class="outside-heading">Mis solicitudes de documentos</h2>${state.documentRequests.length ? state.documentRequests.map(item => `<article class="card"><span class="tag">${escape(item.status)}</span><h3>${escape(item.documentTitle)}</h3><p>${item.channel === 'email' ? 'Correo electrónico' : 'WhatsApp'} · ${escape(item.destination)}</p><div class="meta">${date(item.createdAt)}</div></article>`).join('') : '<div class="empty">No has solicitado ningún envío. También puedes descargar los documentos directamente.</div>'}</section>` : '');
}
function knowledge() {
  const docs = state.managedDocuments || [];
  const labels = { published: 'Publicado', draft: 'Borrador', withdrawn: 'Retirado' };
  return heading('La información, bajo tu control.', 'Carga documentos, revisa el texto y decide qué fuentes pueden consultar los vecinos y el asistente.') + `<div class="note">Solo contenido ficticio durante la demo. Los archivos nuevos quedan en borrador: hasta publicarlos, únicamente los ven administración y gestión autorizadas.</div><div class="card"><h2>Subir un documento</h2><p>PDF con texto, Word DOCX o TXT UTF-8. Máximo 5 MB, 100 páginas de PDF y 200.000 caracteres de texto. Los escaneos necesitan OCR previo.</p><form id="upload-document-form" class="form"><label>Título del documento<input name="title" required maxlength="120" placeholder="Por ejemplo, normas del gimnasio ficticio"></label><label>Archivo<input name="file" type="file" required accept=".pdf,.docx,.txt"></label><p class="private-routing">Comunidad de destino: ${escape(state.name)}. Revisa que no contiene información personal.</p><button class="btn" type="submit">Subir y procesar</button><p id="upload-progress" role="status" hidden>Procesando el documento. Puede tardar unos segundos…</p></form></div><h2 class="outside-heading">Fuentes de ${escape(state.name)} (${docs.length})</h2>${docs.map(doc => `<article class="card knowledge-card" id="managed-${escape(doc.id)}"><span class="tag status">${doc.processingStatus === 'error' ? 'Error de procesamiento' : labels[doc.status]}</span><div class="meta">${doc.origin === 'upload' ? escape(doc.originalFilename) : 'Documento ficticio precargado'} · ${date(doc.updated)}</div><h3>${escape(doc.title)}</h3>${doc.processingStatus === 'error' ? `<p class="processing-error">${escape(doc.processingError)}</p><p>El documento no puede publicarse. Corrige el archivo o prepara una versión con texto y vuelve a subirlo.</p>` : `<details><summary>Revisar texto procesado (${doc.body.length.toLocaleString('es-ES')} caracteres)</summary><pre class="document-preview">${escape(doc.body)}</pre></details>`}<div class="document-actions"><a class="btn secondary" href="/api/documents/${encodeURIComponent(doc.id)}/download?community=${encodeURIComponent(communityId)}" download>${doc.origin === 'upload' ? 'Descargar original' : 'Descargar PDF'}</a></div>${doc.status === 'published' ? `<form class="document-status-form form" data-id="${escape(doc.id)}" data-action="withdraw"><p>Fuente disponible para vecinos y asistente.</p><button class="btn secondary" type="submit">Retirar publicación</button></form>` : doc.processingStatus === 'ready' ? `<form class="document-status-form form" data-id="${escape(doc.id)}" data-action="publish"><label class="confirm-checkbox"><input name="reviewed" type="checkbox" required>He revisado el texto y autorizo su publicación en esta comunidad</label><button class="btn" type="submit">Publicar documento</button></form>` : ''}</article>`).join('')}`;
}
function deliveryMessage(item) {
  const link = new URL('/', location.origin);
  link.searchParams.set('community', item.communityId); link.searchParams.set('document', item.documentId);
  return `Hola. Puedes consultar y descargar el documento «${item.documentTitle}» de ${state.name} en VecinoIA: ${link.href}\nIdentifícate con tu usuario autorizado para abrirlo.\nDemostración con documentos ficticios.`;
}
function deliveries() {
  return heading('Documentos que llegan al vecino.', 'Prepara el mensaje y confirma el envío después de realizarlo en tu correo o WhatsApp.') + `<div class="note">Los mensajes se abren en tu aplicación de correo o en WhatsApp. VecinoIA no los envía automáticamente ni confirma su entrega. Mientras el portal sea local, los enlaces solo funcionan en este ordenador.</div>` + (state.documentRequests.length ? state.documentRequests.map(item => {
    const message = deliveryMessage(item);
    const available = state.documents.some(d => d.id === item.documentId);
    if (!available) return `<article class="card" id="communication-document-${escape(item.id)}"><span class="tag">${escape(item.status)}</span><h3>${escape(item.documentTitle)}</h3><p>${escape(item.resident)} · ${escape(item.destination)}</p><p class="processing-error">Documento retirado o no publicado. Vuelve a publicarlo desde Gestionar documentos antes de preparar un envío.</p></article>`;
    const link = item.channel === 'email' ? `mailto:${encodeURIComponent(item.destination)}?subject=${encodeURIComponent(`Documento solicitado: ${item.documentTitle}`)}&body=${encodeURIComponent(message)}` : `https://wa.me/${encodeURIComponent(item.destination.replace(/^\+/, ''))}?text=${encodeURIComponent(message)}`;
    return `<article class="card" id="communication-document-${escape(item.id)}"><span class="tag">${escape(item.status)}</span><div class="meta">${escape(item.resident)} · ${date(item.createdAt)}</div><h3>${escape(item.documentTitle)}</h3><p>${item.channel === 'email' ? 'Correo electrónico' : 'WhatsApp'} · ${escape(item.destination)}</p><details><summary>Ver mensaje preparado</summary><p>${escape(message)}</p></details><div class="document-actions"><a class="btn" href="${escape(link)}" ${item.channel === 'whatsapp' ? 'target="_blank" rel="noopener noreferrer"' : ''}>${item.channel === 'email' ? 'Abrir correo' : 'Abrir WhatsApp'} ↗</a><button class="btn secondary" data-copy-delivery="${escape(item.id)}">Copiar mensaje</button></div>${item.status === 'Pendiente' ? `<form class="delivery-confirm-form form" data-id="${escape(item.id)}"><label class="confirm-checkbox"><input type="checkbox" required>He realizado el envío fuera de VecinoIA</label><button class="btn secondary" type="submit">Registrar mi confirmación de envío</button></form>` : '<p>Confirmación registrada por el gestor. No acredita recepción del destinatario.</p>'}</article>`;
  }).join('') : '<div class="empty">Las solicitudes de documentos de esta comunidad aparecerán aquí.</div>');
}
function ticketCard(ticket, admin = false) {
  return `<article class="card" id="communication-ticket-${escape(ticket.id)}"><span class="tag status">${escape(communityStatusLabel(ticket.status))}</span><div class="meta">${escape(ticket.category)} · ${escape(ticket.priority)} · ${date(ticket.createdAt)}</div><h3>${escape(ticket.subject)}</h3><p class="ticket-message">${escape(ticket.message)}</p>${ticket.reply ? `<div class="reply"><strong>Respuesta del administrador</strong><p>${escape(ticket.reply)}</p></div>` : ''}${admin ? `<br><form class="form reply-form" data-id="${escape(ticket.id)}"><label>Estado<select name="status">${['Pendiente', 'En revisión', 'Resuelta'].map(status => `<option value="${status}" ${status === ticket.status ? 'selected' : ''}>${communityStatusLabel(status)}</option>`).join('')}</select></label><label>Respuesta<textarea name="reply" maxlength="2000">${escape(ticket.reply)}</textarea></label><button class="btn" type="submit">Guardar respuesta</button></form>` : ''}</article>`;
}
function tickets() {
  return heading('Consultas de tu comunidad.', 'Consulta sobre juntas, normas, recibos comunitarios o incidencias del edificio.') + `<div class="note">Las consultas están asociadas a tu usuario. Los vecinos ven las suyas y los administradores autorizados pueden atenderlas. Utiliza solo datos ficticios.</div><div class="columns"><section><h2>Nueva consulta</h2><form class="card form" id="ticket-form"><label>Asunto<input name="subject" required maxlength="120" value="${escape(pendingQuestion.slice(0, 120))}" placeholder="Por ejemplo, consulta sobre un recibo comunitario ficticio"></label><div class="form-row"><label>Categoría<select name="category">${['General', 'Incidencia', 'Recibos'].map(c => `<option ${c === serviceCategory ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Prioridad<select name="priority"><option>Normal</option><option>Alta</option></select></label></div><label>Mensaje<textarea name="message" required maxlength="2000" placeholder="Utiliza únicamente información ficticia">${escape(pendingQuestion)}</textarea></label><button class="btn" type="submit">Enviar consulta</button></form></section><section><h2>Mis consultas (${state.tickets.length})</h2>${state.tickets.length ? state.tickets.map(t => ticketCard(t)).join('') : '<div class="empty">Aún no hay consultas. Al enviar una, podrás seguir su estado aquí.</div>'}</section></div>`;
}
function services() {
  const items = [['Luz', '↯', 'Tu tarifa de luz', 'Consulta sobre tu suministro eléctrico individual y solicita orientación.'], ['Gas', '♨', 'Tu contrato de gas', 'Pregunta por tu suministro individual de gas, calefacción o agua caliente.'], ['Seguros', '⌂', 'Seguros para tu hogar', 'Consulta opciones y dudas sobre la cobertura de tu vivienda.'], ['Mantenimiento', '⚒', 'Reparaciones particulares', 'Traslada una necesidad de mantenimiento de tu vivienda.'], ['Otras consultas', '◇', 'Lo que necesites consultar', 'Un espacio ampliable para otras dudas y recomendaciones particulares.']];
  return heading('Un espacio solo para tus consultas.', 'Habla con el equipo de Gestión VecinoIA sobre tus necesidades particulares.') + `<div class="note">Tus solicitudes son privadas entre tu usuario y Gestión VecinoIA. El administrador de la comunidad no puede verlas. Utiliza datos ficticios; no se realizan contratos ni comparaciones de ofertas reales.</div><div class="services">${items.map(([category, icon, title, description]) => `<article class="card"><div class="service-icon" aria-hidden="true">${icon}</div><h2>${title}</h2><p>${description}</p><button class="btn secondary" data-service="${category}">Consultar ${category.toLowerCase()} ↗</button></article>`).join('')}</div><div class="columns"><section><h2 class="outside-heading">Nueva consulta particular</h2><form class="card form" id="private-request-form"><label>Categoría<select name="category">${privateCategories.map(c => `<option ${c === privateCategory ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Asunto<input name="subject" required maxlength="120" placeholder="Por ejemplo, revisar mi tarifa ficticia de gas"></label><label>Tu consulta<textarea name="message" required maxlength="2000" placeholder="Cuéntanos tu duda utilizando únicamente información ficticia"></textarea></label><p class="private-routing">La atenderá Gestión VecinoIA. Comunidad de referencia: ${escape(state.name)}.</p><button class="btn" type="submit">Enviar a Gestión VecinoIA</button></form></section><section><h2 class="outside-heading">Mis consultas particulares (${privateRequests.length})</h2>${privateRequests.length ? privateRequests.map(item => privateCard(item)).join('') : '<div class="empty">Tus solicitudes y las respuestas del equipo aparecerán aquí.</div>'}</section></div>`;
}
function privateCard(item, canReply = false) {
  return `<article class="card" id="communication-service-${escape(item.id)}"><span class="tag status">${escape(item.status)}</span><div class="meta">${escape(item.category)} · ${date(item.createdAt)}</div><h3>${escape(item.subject)}</h3><div class="meta">${escape(item.communityName)}${canReply ? ` · ${escape(item.resident)}` : ''}</div><p class="ticket-message">${escape(item.message)}</p>${item.reply ? `<div class="reply"><strong>Respuesta de Gestión VecinoIA</strong><p>${escape(item.reply)}</p></div>` : ''}${canReply ? `<form class="form private-reply-form" data-id="${escape(item.id)}" data-community="${escape(item.communityId)}"><label>Estado<select name="status">${['Pendiente', 'En revisión', 'Resuelta'].map(s => `<option ${s === item.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Respuesta privada al vecino<textarea name="reply" maxlength="2000">${escape(item.reply)}</textarea></label><button class="btn" type="submit">Guardar respuesta privada</button></form>` : ''}</article>`;
}
function serviceInbox() {
  const filtered = privateFilter === 'Todas' ? privateRequests : privateRequests.filter(item => item.status === privateFilter);
  return heading('Atención particular de VecinoIA.', 'Bandeja de todas las comunidades asignadas a tu usuario de gestión.') + `<div class="note">Solo Gestión VecinoIA y el vecino autor pueden acceder a estas solicitudes. Los asuntos comunitarios permanecen en Administración.</div><div class="stats">${['Pendiente', 'En revisión', 'Resuelta'].map(status => `<div class="stat"><strong>${privateRequests.filter(r => r.status === status).length}</strong><span>${status}</span></div>`).join('')}</div><div class="card inbox-filter"><label for="private-filter">Mostrar solicitudes</label><select id="private-filter">${['Todas', 'Pendiente', 'En revisión', 'Resuelta'].map(s => `<option ${s === privateFilter ? 'selected' : ''}>${s}</option>`).join('')}</select><span>${filtered.length} solicitudes · Todas tus comunidades autorizadas</span></div>${filtered.length ? filtered.map(item => privateCard(item, true)).join('') : '<div class="empty">No hay consultas particulares con este estado.</div>'}`;
}
function admin() {
  const filtered = adminFilter === 'Todas' ? state.tickets : state.tickets.filter(t => t.status === adminFilter);
  const completed = state.tickets.filter(t => t.status === 'Resuelta').length;
  return heading('Una comunidad bien atendida.', 'Consulta el estado de las comunicaciones y atiende a los vecinos de la comunidad seleccionada.') +
    `<div class="note">Resumen de consultas e incidencias de ${escape(state.name)}. Las consultas particulares las atiende Gestión VecinoIA en su canal privado.</div>
    <div class="stats" aria-label="Resumen de comunicaciones">
      ${[['Pendiente', 'Pendientes'], ['En revisión', 'En curso'], ['Resuelta', 'Terminadas']].map(([status, label]) => `<div class="stat"><strong>${state.tickets.filter(t => t.status === status).length}</strong><span>${label}</span></div>`).join('')}
    </div>
    <section class="card communications-toolbar"><div><label for="admin-filter">Mostrar comunicaciones</label><select id="admin-filter">${[['Todas', 'Todas'], ['Pendiente', 'Pendientes'], ['En revisión', 'En curso'], ['Resuelta', 'Terminadas']].map(([value, label]) => `<option value="${value}" ${value === adminFilter ? 'selected' : ''}>${label}</option>`).join('')}</select><p>${filtered.length} de ${state.tickets.length} comunicaciones</p></div><form id="clear-completed-form" class="form"><p>Elimina solo las ${completed} terminadas de esta comunidad, también de la vista de sus vecinos.</p><button class="btn secondary" type="submit" ${completed ? '' : 'disabled'}>Eliminar completadas (${completed})</button></form></section>
    <div class="columns"><section><h2>Consultas de ${escape(state.name)}</h2>${filtered.length ? filtered.map(t => ticketCard(t, true)).join('') : `<div class="empty">${state.tickets.length ? 'No hay comunicaciones con este estado.' : 'No hay comunicaciones. Las nuevas consultas e incidencias aparecerán aquí.'}</div>`}</section><section><h2>Publicar un aviso</h2><form class="card form" id="announcement-form"><label>Tipo de aviso<select name="urgency" id="announcement-urgency"><option value="ordinary">Ordinario · Sin urgencia</option><option value="urgent">Urgente · Banner destacado y correo simulado</option></select></label><p id="announcement-explanation" class="private-routing">Se publicará en los avisos de la comunidad, sin banner urgente ni notificación por correo.</p><label>Título<input name="title" required maxlength="120"></label><label>Contenido<textarea name="body" required maxlength="2000"></textarea></label><button class="btn" type="submit">Publicar aviso</button></form></section></div>` + announcementManagement() + ordinaryAnnouncementManagement();
}

function announcementManagement() {
  const notices = state.announcements.filter(a => a.urgency === 'urgent');
  return `<section class="urgent-management"><h2 class="outside-heading">Seguimiento de avisos urgentes</h2>${notices.length ? notices.map(a => `<article class="card"><span class="tag">${a.active === false ? 'Finalizado' : 'Urgente activo'}</span><h3>${escape(a.title)}</h3><p class="announcement-body">${escape(a.body)}</p><div class="email-simulation"><strong>Notificación por correo: simulada</strong><p>${a.emailNotification?.recipientCount || 0} cuentas de vecinos de esta comunidad incluidas. Correos reales enviados: 0.</p><p>Esta demo no envía correo real.</p><details><summary>Ver correo de demostración</summary><p><strong>Asunto:</strong> URGENTE · ${escape(state.name)} · ${escape(a.title)}</p><p class="announcement-body">${escape(a.body)}</p><p>Consulta el portal de tu comunidad para seguir las novedades.</p></details></div>${a.active === false ? '<p>El banner destacado ya no se muestra a los vecinos.</p>' : `<form class="end-announcement-form form" data-id="${escape(a.id)}"><button class="btn secondary" type="submit">Finalizar aviso urgente</button><p>Retira el banner destacado y conserva el comunicado en el historial de avisos.</p></form>`}</article>`).join('') : '<div class="empty">Los avisos urgentes y sus notificaciones simuladas aparecerán aquí.</div>'}</section>`;
}
function ordinaryAnnouncementManagement() {
  const notices = state.announcements.filter(a => a.urgency !== 'urgent');
  return `<section class="ordinary-management"><h2 class="outside-heading">Gestionar avisos ordinarios</h2><p class="note">Edita el título o contenido de un aviso. Si lo eliminas, dejará de aparecer también en el portal de los vecinos.</p>${notices.length ? notices.map(a => `<article class="card"><span class="tag">Ordinario</span><h3>${escape(a.title)}</h3><p class="announcement-body">${escape(a.body)}</p><details><summary>Editar aviso</summary><form class="edit-announcement-form form" data-id="${escape(a.id)}"><label>Título<input name="title" value="${escape(a.title)}" required maxlength="120"></label><label for="ordinary-body-${escape(a.id)}">Contenido</label><textarea id="ordinary-body-${escape(a.id)}" name="body" required maxlength="2000">${escape(a.body)}</textarea><button class="btn" type="submit">Guardar cambios</button></form></details><form class="delete-announcement-form form" data-id="${escape(a.id)}" data-title="${escape(a.title)}"><button class="btn secondary" type="submit">Eliminar aviso</button></form></article>`).join('') : '<div class="empty">No hay avisos ordinarios en esta comunidad.</div>'}</section>`;
}
function advice() {
  const staff = role !== 'resident';
  const items = (state.advice || []).filter(a => adviceFilter === 'Todas' || a.kind === adviceFilter);
  const edit = state.advice?.find(a => a.id === editingAdvice && a.status !== 'published');
  const labels = { published: 'Publicado', draft: 'Borrador', withdrawn: 'Retirado' };
  const options = (values, selected) => values.map(v => `<option ${v === selected ? 'selected' : ''}>${escape(v)}</option>`).join('');
  return heading('Más posibilidades para tu hogar.', 'Consejos, información sobre ayudas y servicios energéticos y técnicos, seleccionados para tu comunidad.') +
    `<div class="note">Contenido de demostración para el concurso. Las fichas de ejemplo no son ofertas ni convocatorias vigentes. Las consultas particulares las atiende Gestión VecinoIA y solo las ve el vecino que las envía y el equipo de gestión autorizado.</div>
    <div class="card inbox-filter"><label for="advice-filter">Explorar</label><select id="advice-filter">${options(['Todas', 'Consejos', 'Ayudas', 'Servicios'], adviceFilter)}</select></div>
    <div class="advice-grid">${items.length ? items.map(a => `<article class="card advice-card"><div><span class="tag">${escape(a.kind)}</span> ${staff ? `<span class="tag status">${labels[a.status]}</span>` : ''}</div><div class="meta">${escape(a.category)} · ${date(a.updated)}${a.demo ? ' · Ejemplo ficticio' : ''}</div><h2>${escape(a.title)}</h2><p class="advice-body">${escape(a.body)}</p>${role === 'resident' ? `<button class="btn secondary" data-service="${escape(a.category)}">Solicitar orientación privada ↗</button>` : `<div class="document-actions">${a.status !== 'published' ? `<button class="btn secondary" data-edit-advice="${escape(a.id)}">Editar contenido</button>` : ''}</div><form class="advice-status-form form" data-id="${escape(a.id)}" data-action="${a.status === 'published' ? 'withdraw' : 'publish'}">${a.status === 'published' ? '' : '<label class="confirm-checkbox"><input type="checkbox" name="reviewed" required>He revisado el contenido y autorizo publicarlo en esta comunidad</label>'}<button type="submit" class="btn secondary">${a.status === 'published' ? 'Retirar publicación' : 'Publicar contenido'}</button></form>`}</article>`).join('') : '<div class="empty">No hay contenidos en esta sección.</div>'}</div>
    ${staff ? `<section class="card" id="advice-editor"><h2>${edit ? 'Editar contenido' : 'Crear contenido'}</h2><p>Se guardará como borrador para ${escape(state.name)}. Revisa la información antes de publicarla.</p><form id="advice-form" class="form" data-id="${escape(edit?.id || '')}"><label>Sección<select name="kind">${options(['Consejos', 'Ayudas', 'Servicios'], edit?.kind)}</select></label><label>Tipo de consulta particular<select name="category">${options(privateCategories, edit?.category)}</select></label><label>Título<input name="title" maxlength="120" required value="${escape(edit?.title || '')}"></label><label>Contenido<textarea name="body" maxlength="4000" required>${escape(edit?.body || '')}</textarea></label><button class="btn" type="submit">Guardar borrador</button>${edit ? '<button class="btn secondary" type="button" data-action="cancel-advice">Cancelar edición</button>' : ''}</form></section>` : ''}`;
}
function navigationMenu() {
  const staff = role !== 'resident';
  const openGroups = new Set([...$('#nav').querySelectorAll('details[open]')].map(d => d.dataset.navGroup));
  const link = ([id, icon, label]) => `<button type="button" data-page="${id}" class="${id === page ? 'active' : ''}" ${id === page ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span><span>${label}</span></button>`;
  const folder = (id, label, items) => {
    const active = items.some(([item]) => item === page);
    return `<details class="nav-folder ${active ? 'has-active' : ''}" data-nav-group="${id}" ${active || openGroups.has(id) ? 'open' : ''}><summary><span aria-hidden="true">▱</span><span>${label}</span><span class="nav-chevron" aria-hidden="true">›</span></summary><div class="nav-children">${items.map(link).join('')}</div></details>`;
  };
  return link(['home', '⌂', 'Mi comunidad']) + link(['assistant', '✧', 'Asistente'])
    + folder('documents', 'Documentos', [['documents', '▤', 'Consultar documentos'], ...(staff ? [['knowledge', '▤', 'Gestionar documentos'], ['deliveries', '↗', 'Envío de documentos']] : [])])
    + folder('messages', 'Mensajes', [[staff ? 'staffMessages' : 'residentMessages', '♧', 'Bandeja de mensajes'], ['tickets', '✉', 'Consultas comunidad'], ...(!staff ? [['messages', '✉', 'Avisos particulares']] : [])])
    + (staff ? folder('neighbors', 'Vecinos', [['directory', '▤', 'Directorio de vecinos'], ['neighborContact', '✉', 'Contacto con los vecinos'], ...(role === 'manager' ? [['serviceInbox', '◇', 'Atención particular']] : [])]) : '')
    + link(['advice', '✦', 'Consejos, ayudas y servicios'])
    + link(staff ? ['admin', '▦', 'Administración'] : ['services', '◇', 'Consultas particulares']);
}
function render() {
  document.documentElement.style.setProperty('--accent', state.color);
  document.documentElement.style.setProperty('--community-photo', `url("${state.backgroundImage}")`);
  document.documentElement.style.setProperty('--community-photo-position', state.backgroundPosition);
  $('#content').classList.toggle('home-page', page === 'home');
  $('#community-name').textContent = state.name;
  if (['admin', 'deliveries', 'knowledge', 'neighborContact', 'staffMessages', 'directory'].includes(page) && role === 'resident') page = 'home';
  if (['messages','residentMessages'].includes(page) && role !== 'resident') page = 'home';
  if ((page === 'serviceInbox' && role !== 'manager') || (page === 'services' && role !== 'resident')) page = 'home';
  $('#nav').innerHTML = navigationMenu();
  $('#staff-inbox-slot').innerHTML = staffBell();
  $('#content').innerHTML = urgentBanners() + neighborInboxNotice() + ({ home, assistant, documents, tickets, services, admin, deliveries, serviceInbox, knowledge, advice, neighborContact, messages, staffMessages, residentMessages, directory })[page]();
  document.title = `VecinoIA · ${state.name}`;
}
function navigate(next) { if (loading) return; page = next; render(); $('#content').focus(); }
let refreshingUrgent = false;
async function refreshUrgentAnnouncements() {
  if (!user || role !== 'resident' || loading || refreshingUrgent || document.visibilityState !== 'visible') return;
  const target = communityId, userId = user.id, version = stateVersion;
  refreshingUrgent = true;
  try {
    const [next, residentInbox] = await Promise.all([api('state', 'GET', undefined, target), api('resident-inbox')]);
    if (user?.id !== userId || communityId !== target || !state || loading || stateVersion !== version) return;
    state.announcements = next.announcements;
    state.neighborMessages = next.neighborMessages;
    staffInboxData = residentInbox;
    $('#staff-inbox-slot').innerHTML = staffBell();
    if(page === 'residentMessages' && $('#resident-inbox-list')) $('#resident-inbox-list').innerHTML = residentInboxCards();
    const area = $('#urgent-notices');
    if (area) area.outerHTML = urgentBanners();
    const inbox = $('#neighbor-inbox-notice');
    if (inbox) inbox.outerHTML = neighborInboxNotice();
    if (page === 'messages' && $('#neighbor-message-list')) $('#neighbor-message-list').innerHTML = neighborMessageCards(false);
  } catch { /* Un fallo temporal no interrumpe el formulario del vecino. */ }
  finally { refreshingUrgent = false; }
}
setInterval(refreshUrgentAnnouncements, 30000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshUrgentAnnouncements(); });
async function ask(question) {
  if (loading) return;
  const target = communityId;
  loading = true;
  $('#ask-form button').disabled = true;
  try {
    const answer = await api('ask', 'POST', { question }, target);
    if (communityId !== target) return;
    chat.push({ user: true, text: question }, { text: answer.answer, source: answer.source, sources: answer.sources, unresolved: answer.unresolved, engine: answer.engine, notice: answer.notice });
    pendingQuestion = answer.unresolved ? question : '';
    render(); $('#question')?.focus();
  } catch (error) { notice(error.message); }
  finally { loading = false; if ($('#ask-form button')) $('#ask-form button').disabled = false; }
}
document.addEventListener('click', event => {
  const residentMessage = event.target.closest('[data-open-resident]');
  if(residentMessage){openResidentCommunication(residentMessage.dataset.openResident,residentMessage.dataset.kind);return;}
  const button = event.target.closest('button'); if (!button) return;
  if (button.id === 'logout') {
    if (loading) return;
    button.disabled = true;
    api('logout', 'POST', {}).then(() => { showLogin(); $('#username').focus(); }).catch(error => notice(error.message)).finally(() => { button.disabled = false; });
    return;
  }
  if (!user) return;
  if (button.dataset.openCommunication) { openCommunication(button.dataset.openCommunication, button.dataset.kind); return; }
  if (button.dataset.editResident) { editingResident=button.dataset.editResident; render(); $('#resident-directory-form')?.scrollIntoView({block:'center'}); return; }
  if (button.dataset.action === 'cancel-resident-edit') {editingResident='';render();return;}
  if (button.dataset.editAdvice) { editingAdvice = button.dataset.editAdvice; render(); $('#advice-editor')?.scrollIntoView({ block: 'center' }); }
  if (button.dataset.action === 'cancel-advice') { editingAdvice = ''; render(); }
  if (button.dataset.documentRequest) { requestedDocument = button.dataset.documentRequest; navigate('documents'); $('#document-request-form')?.scrollIntoView({ block: 'center', behavior: 'auto' }); }
  if (button.dataset.copyDelivery) {
    const item = state.documentRequests.find(r => r.id === button.dataset.copyDelivery);
    if (item) navigator.clipboard?.writeText(deliveryMessage(item)).then(() => notice('Mensaje copiado')).catch(() => notice('No se pudo copiar. Puedes seleccionarlo en «Ver mensaje preparado».'));
  }
  if (button.dataset.action === 'retry') { load(); return; }
  if (button.dataset.page) navigate(button.dataset.page);
  if (button.dataset.question) ask(button.dataset.question);
  if (button.dataset.action === 'escalate') { serviceCategory = 'General'; const bubble = button.closest('.bubble'); const index = [...$('.chat-log').children].indexOf(bubble); pendingQuestion = chat[index - 1]?.text || pendingQuestion; navigate('tickets'); }
  if (button.dataset.service) { privateCategory = button.dataset.service; navigate('services'); $('#private-request-form')?.scrollIntoView({ block: 'center', behavior: 'auto' }); }
});
document.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target;
  const body = Object.fromEntries(new FormData(form));
  if (form.id === 'login-form') {
    const button = form.querySelector('button'); button.disabled = true; $('#login-error').hidden = true;
    try { const session = await api('login', 'POST', body); await enterPortal(session); }
    catch (error) { showLogin(); $('#login-error').textContent = error.message; $('#login-error').hidden = false; }
    finally { button.disabled = false; }
    return;
  }
  if (form.id === 'ask-form') { await ask(body.question.trim()); return; }
  if (loading) return;
  if (form.classList.contains('delete-announcement-form') && !window.confirm(`¿Eliminar el aviso «${form.dataset.title}» de esta comunidad? Dejará de estar disponible para sus vecinos.`)) return;
  stateVersion++;
  const button = form.querySelector('button[type="submit"]');
  const target = communityId; loading = true; button.disabled = true; $('#community').disabled = true;
  try {
    let savedDocument, successMessage = 'Guardado correctamente';
    const dismissingAnnouncement = form.classList.contains('dismiss-announcement-form');
    if (dismissingAnnouncement) {
      await api(`announcements/${form.dataset.id}`, 'PATCH', { action: 'dismiss' }, target);
      successMessage = 'Anuncio quitado de tu página';
    }
    else if (form.id === 'clear-completed-form') {
      const result = await api('tickets/clear-completed', 'POST', {}, target);
      successMessage = `${result.removed} consultas completadas eliminadas`;
    }
    else if (form.id === 'upload-document-form') {
      const file = form.querySelector('input[type="file"]').files[0];
      if (!file || file.size > 5 * 1024 * 1024) throw new Error('Selecciona un archivo de hasta 5 MB');
      $('#upload-progress').hidden = false;
      savedDocument = await api('documents/upload', 'POST', new FormData(form), target);
    }
    else if (form.classList.contains('document-status-form')) await api(`documents/${form.dataset.id}`, 'PATCH', { action: form.dataset.action, reviewed: body.reviewed === 'on' }, target);
    else if (form.id === 'advice-form') { await api(form.dataset.id ? `advice/${form.dataset.id}` : 'advice', form.dataset.id ? 'PATCH' : 'POST', { ...body, action: 'edit' }, target); editingAdvice = ''; }
    else if (form.classList.contains('advice-status-form')) { await api(`advice/${form.dataset.id}`, 'PATCH', { action: form.dataset.action, reviewed: body.reviewed === 'on' }, target); editingAdvice = ''; }
    else if (form.id === 'resident-directory-form') {
      await api(form.dataset.id ? `resident-directory/${form.dataset.id}` : 'resident-directory', form.dataset.id ? 'PATCH' : 'POST', body, target);editingResident='';successMessage='Contacto de vecino guardado';
    }
    else if (form.id === 'neighbor-contact-form') {
      await api('neighbor-messages', 'POST', body, target); successMessage = 'Aviso particular enviado al portal del vecino';
    }
    else if (form.classList.contains('read-neighbor-message-form')) await api(`neighbor-messages/${form.dataset.id}`, 'PATCH', { action: 'read' }, target);
    else if (form.id === 'ticket-form') { await api('tickets', 'POST', body, target); pendingQuestion = ''; serviceCategory = 'General'; }
    else if (form.id === 'private-request-form') await api('service-requests', 'POST', body, target);
    else if (form.classList.contains('private-reply-form')) await api(`service-requests/${form.dataset.id}`, 'PATCH', body, form.dataset.community);
    else if (form.id === 'document-request-form') { await api('document-requests', 'POST', body, target); requestedDocument = ''; }
    else if (form.classList.contains('delivery-confirm-form')) await api(`document-requests/${form.dataset.id}`, 'PATCH', { status: 'Envío confirmado por gestor' }, target);
    else if (form.id === 'announcement-form') {
      const published = await api('announcements', 'POST', body, target);
      successMessage = published.urgency === 'urgent' ? `Aviso urgente publicado. Correo simulado para ${published.emailNotification.recipientCount} vecinos; no se han enviado correos reales.` : 'Aviso ordinario publicado';
    }
    else if (form.classList.contains('end-announcement-form')) await api(`announcements/${form.dataset.id}`, 'PATCH', { action: 'end' }, target);
    else if (form.classList.contains('edit-announcement-form')) {
      await api(`announcements/${form.dataset.id}`, 'PATCH', { action: 'edit', title: body.title, body: body.body }, target);
      successMessage = 'Aviso ordinario actualizado';
    }
    else if (form.classList.contains('delete-announcement-form')) {
      await api(`announcements/${form.dataset.id}`, 'PATCH', { action: 'delete' }, target);
      successMessage = 'Aviso ordinario eliminado';
    }
    else if (form.classList.contains('reply-form')) await api(`tickets/${form.dataset.id}`, 'PATCH', body, target);
    const [next, requests, inbox] = await Promise.all([api('state', 'GET', undefined, target), role === 'admin' ? Promise.resolve([]) : api('service-requests'), api(role === 'resident' ? 'resident-inbox' : 'staff-inbox')]);
    if(inbox)staffInboxData=inbox;
    state = next; privateRequests = requests;
    if (dismissingAnnouncement) {
      if ($('#urgent-notices')) $('#urgent-notices').outerHTML = urgentBanners();
      if ($('#home-announcements-list')) $('#home-announcements-list').innerHTML = announcementList();
      if ($('#home-announcement-count')) $('#home-announcement-count').textContent = state.announcements.length;
    } else render();
    notice(savedDocument ? (savedDocument.processingStatus === 'error' ? 'Archivo guardado con error de procesamiento. Revisa el aviso.' : 'Documento procesado y guardado como borrador. Revísalo antes de publicar.') : successMessage);
    if (savedDocument) document.getElementById(`managed-${savedDocument.id}`)?.scrollIntoView({ block: 'center', behavior: 'auto' });
  } catch (error) { notice(error.message); }
  finally { loading = false; button.disabled = false; $('#community').disabled = $('#community').options.length <= 1; if ($('#upload-progress')) $('#upload-progress').hidden = true; }
});
document.addEventListener('change', event => {
  if(event.target.id==='staff-inbox-filter'){staffInboxFilter=event.target.value;render();}
  if (event.target.id === 'announcement-urgency') {
    $('#announcement-explanation').textContent = event.target.value === 'urgent' ? 'Aparecerá un banner destacado en el portal. Se registrará un correo simulado para los vecinos de esta comunidad; no se enviarán correos reales.' : 'Se publicará en los avisos de la comunidad, sin banner urgente ni notificación por correo.';
  }
  if (event.target.id === 'admin-filter') { adminFilter = event.target.value; render(); }
  if (event.target.id === 'advice-filter') { adviceFilter = event.target.value; render(); }
  if (event.target.id === 'private-filter') { privateFilter = event.target.value; render(); }
  if (event.target.id === 'delivery-channel') {
    const whatsapp = event.target.value === 'whatsapp';
    $('#destination-label').firstChild.textContent = whatsapp ? 'Teléfono ficticio con prefijo internacional' : 'Correo electrónico ficticio';
    const input = $('#delivery-destination'); input.value = ''; input.type = whatsapp ? 'tel' : 'email'; input.placeholder = whatsapp ? '+34000000000' : 'vecino@example.com';
    if (whatsapp) input.setAttribute('pattern', '[+]?[0-9]{8,15}'); else input.removeAttribute('pattern');
  }
});
$('#community').addEventListener('change', async event => { if (loading) { event.target.value = communityId; return; } communityId = event.target.value; editingResident = ''; adminFilter = 'Todas'; editingAdvice = ''; adviceFilter = 'Todas'; chat = []; pendingQuestion = ''; serviceCategory = 'General'; requestedDocument = ''; await load(); });
showLogin();
try {
  const response = await fetch('/api/session');
  if (response.ok) await enterPortal(await response.json());
  else if (response.status !== 401) throw new Error('No se pudo recuperar tu sesión');
} catch (error) { showLogin(); $('#login-error').textContent = 'No se pudo conectar. Comprueba el servidor y recarga la página.'; $('#login-error').hidden = false; }



