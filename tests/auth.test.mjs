import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { createApp } from '../server.mjs';
import { demoAccounts } from '../src/auth.mjs';
import { documentPDF } from '../src/pdf.mjs';
import { createAssistant } from '../src/assistant.mjs';

async function fixture(assistant = createAssistant({ apiKey: '' })) {
  const dir = mkdtempSync(join(tmpdir(), 'vecinoia-auth-'));
  let server, base;
  const dataFile = join(dir, 'demo.json');
  async function start() { server = createApp({ dataFile, assistant }); await new Promise(r => server.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${server.address().port}`; }
  async function stop() { if (server?.listening) await new Promise(r => server.close(r)); }
  async function request(path, method = 'GET', body, session, extra = {}) {
    const response = await fetch(`${base}/api/${path}`, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.csrfToken } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function login(username) {
    const account = demoAccounts.find(a => a.username === username);
    const r = await request('login', 'POST', { username, password: account.password });
    assert.equal(r.status, 200);
    return { cookie: r.cookie.split(';')[0], csrfToken: r.body.csrfToken, user: r.body.user };
  }
  await start();
  const download = async (path, session) => {
    const response = await fetch(`${base}/api/${path}`, { headers: session ? { Cookie: session.cookie } : {} });
    return { status: response.status, type: response.headers.get('content-type'), disposition: response.headers.get('content-disposition'), data: Buffer.from(await response.arrayBuffer()) };
  };
  const upload = async (filename, bytes, title, session, community = 'olivos') => {
    const form = new FormData(); form.set('title', title); form.set('file', new Blob([bytes]), filename);
    const response = await fetch(`${base}/api/documents/upload?community=${community}`, { method: 'POST', headers: session ? { Cookie: session.cookie, 'X-CSRF-Token': session.csrfToken } : {}, body: form });
    return { status: response.status, body: await response.json() };
  };
  return { request, login, download, upload, dir, restart: async () => { await stop(); await start(); }, close: async () => { await stop(); const rel = relative(resolve(tmpdir()), resolve(dir)); assert.ok(rel && !rel.startsWith('..')); rmSync(dir, { recursive: true, force: true }); } };
}
const draft = { subject: 'Recibo ficticio', message: 'Revisar importe de ejemplo', category: 'Recibos', priority: 'Normal' };

test('Campana del vecino: respuestas privadas, revisiones, correo simulado y lectura persistente', async () => {
  const f=await fixture();
  try {
    let resident=await f.login('vecino.olivos');
    const other=await f.login('vecino.olivos2'),plaza=await f.login('vecino.plaza'),admin=await f.login('administrador'),manager=await f.login('gestion');
    const inbox=async s=>(await f.request('resident-inbox','GET',undefined,s)).body;
    const ticket=(await f.request('tickets?community=olivos','POST',draft,resident)).body;
    const service=(await f.request('service-requests?community=olivos','POST',{category:'Gas',subject:'Gas privado',message:'Ejemplo ficticio'},resident)).body;
    const answer={status:'En revisión',reply:'Respuesta ficticia'};
    await f.request(`tickets/${ticket.id}?community=olivos`,'PATCH',answer,admin);
    await f.request(`service-requests/${service.id}?community=olivos`,'PATCH',answer,manager);
    const message=(await f.request('neighbor-messages?community=olivos','POST',{recipientId:resident.user.id,subject:'Aviso personal',message:'Aviso de prueba'},admin)).body;
    let received=await inbox(resident);assert.equal(received.unreadCount,3);assert.equal(received.simulatedEmailCount,3);
    assert.ok(received.items.every(i=>i.email.mode==='simulation'&&i.email.sentCount===0));
    assert.equal((await inbox(other)).items.length,0);assert.equal((await inbox(plaza)).items.length,0);
    assert.equal((await f.request('resident-inbox','GET',undefined,admin)).status,403);
    const item=received.items.find(i=>i.kind==='ticket');
    assert.equal((await f.request('resident-inbox/read','POST',item,other)).status,404);
    assert.equal((await f.request('resident-inbox/read','POST',item,resident,{'X-CSRF-Token':'wrong'})).status,403);
    assert.equal((await f.request('resident-inbox/read','POST',item,resident)).body.unreadCount,2);
    await f.request(`tickets/${ticket.id}?community=olivos`,'PATCH',{...answer,status:'Resuelta'},admin);
    assert.equal((await inbox(resident)).unreadCount,2);
    await f.request(`tickets/${ticket.id}?community=olivos`,'PATCH',{...answer,reply:'Respuesta corregida'},admin);
    assert.equal((await inbox(resident)).unreadCount,3);
    assert.equal((await f.request('resident-inbox/read','POST',item,resident)).status,404);
    await f.request(`neighbor-messages/${message.id}?community=olivos`,'PATCH',{action:'read'},resident);
    received=await inbox(resident);assert.equal(received.unreadCount,2);
    for(const i of received.items)assert.equal((await f.request('resident-inbox/read','POST',i,resident)).status,200);
    await f.restart();resident=await f.login('vecino.olivos');assert.equal((await inbox(resident)).unreadCount,0);
  } finally {await f.close();}
});

test('Campana por usuario: comunidades, canal privado, simulación de correo y lectura persistente', async () => {
  const f=await fixture();
  try {
    let admin=await f.login('administrador');const limited=await f.login('admin.olivos'),manager=await f.login('gestion'),resident=await f.login('vecino.olivos'),plaza=await f.login('vecino.plaza');
    const ticket=(await f.request('tickets?community=olivos','POST',draft,resident)).body;
    const service=(await f.request('service-requests?community=olivos','POST',{category:'Gas',subject:'Servicio privado ficticio',message:'Consulta particular ficticia'},resident)).body;
    await f.request('tickets?community=plaza','POST',draft,plaza);
    const inbox=async session=>(await f.request('staff-inbox','GET',undefined,session)).body;
    assert.equal((await f.request('staff-inbox','GET',undefined,resident)).status,403);
    assert.equal((await inbox(admin)).unreadCount,2);assert.equal((await inbox(limited)).unreadCount,1);assert.equal((await inbox(manager)).unreadCount,3);
    assert.ok(!(await inbox(admin)).items.some(i=>i.kind==='service'));
    assert.equal((await inbox(admin)).simulatedEmailCount,2);assert.equal((await inbox(manager)).simulatedEmailCount,3);
    assert.equal((await f.request('staff-inbox/read','POST',{id:service.id,kind:'service'},admin)).status,404);
    assert.equal((await f.request('staff-inbox/read','POST',{id:ticket.id,kind:'ticket'},admin,{'X-CSRF-Token':'incorrecto'})).status,403);
    assert.equal((await f.request('staff-inbox/read','POST',{id:ticket.id,kind:'ticket'},admin)).body.unreadCount,1);
    assert.equal((await inbox(manager)).unreadCount,3);assert.equal((await inbox(limited)).unreadCount,1);
    const state=(await f.request('state?community=olivos','GET',undefined,resident)).body;
    const documentRequest=(await f.request('document-requests?community=olivos','POST',{documentId:state.documents[0].id,channel:'email',destination:'demo@example.com'},resident)).body;
    assert.equal((await inbox(admin)).unreadCount,2);assert.equal((await inbox(manager)).unreadCount,4);
    assert.equal((await f.request(`document-requests/${documentRequest.id}?community=olivos`,'PATCH',{status:'Envío confirmado por gestor'},admin)).status,200);
    assert.equal((await inbox(admin)).unreadCount,1);
    await f.restart();admin=await f.login('administrador');assert.equal((await inbox(admin)).unreadCount,1);
    const data=JSON.parse(readFileSync(join(f.dir,'demo.json'),'utf8'));assert.ok(data.staffEmailNotifications.every(n=>n.mode==='simulation'&&n.sentCount===0));
  }finally{await f.close();}
});

test('Directorio de vecinos: validación, vinculación, privacidad y persistencia sin crear cuentas', async () => {
  const f=await fixture();
  try {
    let admin=await f.login('admin.olivos');const resident=await f.login('vecino.olivos'),manager=await f.login('gestion');
    const state=async(session=admin,c='olivos')=>(await f.request(`state?community=${c}`,'GET',undefined,session)).body;
    const initial=await state();assert.equal(initial.residentDirectory.length,2);assert.equal((await state(resident)).residentDirectory,undefined);
    const contact={floor:'Bajo',unit:'B',firstName:'Persona',lastName:'De Prueba',email:'persona@example.com',phone:'+34 000 000 000'};
    assert.equal((await f.request('resident-directory?community=olivos','POST',contact,resident)).status,403);
    assert.equal((await f.request('resident-directory?community=plaza','POST',contact,admin)).status,403);
    assert.equal((await f.request('resident-directory?community=olivos','POST',{...contact,email:'mal'},admin)).status,400);
    assert.equal((await f.request('resident-directory?community=olivos','POST',{...contact,phone:'abc'},admin)).status,400);
    assert.equal((await f.request('resident-directory?community=olivos','POST',{...contact,userId:'neighbor-plaza'},admin)).status,400);
    assert.equal((await f.request('resident-directory?community=olivos','POST',{...contact,userId:resident.user.id},admin)).status,400);
    const created=await f.request('resident-directory?community=olivos','POST',contact,admin);assert.equal(created.status,201);assert.equal(created.body.userId,null);
    assert.equal((await state()).residents.length,2);
    const seed=initial.residentDirectory[0];const edit={...seed,lastName:'Ejemplo Actualizado'};
    assert.equal((await f.request(`resident-directory/${seed.id}?community=olivos`,'PATCH',edit,admin)).status,200);
    assert.ok((await state()).residents.some(r=>r.name.includes('Ejemplo Actualizado')));
    const plaza=(await state(manager,'plaza')).residentDirectory[0];assert.equal((await f.request(`resident-directory/${plaza.id}?community=olivos`,'PATCH',contact,admin)).status,404);
    await f.restart();admin=await f.login('admin.olivos');const after=await state();assert.equal(after.residentDirectory.length,3);assert.ok(after.residentDirectory.some(r=>r.id===created.body.id&&r.email===contact.email));
  }finally{await f.close();}
});

test('Quitar anuncio es individual, persistente e idempotente y no elimina la publicación', async () => {
  const f=await fixture();
  try {
    let resident=await f.login('vecino.olivos');const other=await f.login('vecino.olivos2'),admin=await f.login('admin.olivos');
    const state=async session=>(await f.request('state?community=olivos','GET',undefined,session)).body;
    const initial=await state(resident),id=initial.announcements[0].id,path=`announcements/${id}?community=olivos`;
    assert.equal((await f.request(path,'PATCH',{action:'dismiss'},admin)).status,403);
    assert.equal((await f.request(path,'PATCH',{action:'dismiss'},resident,{'X-CSRF-Token':'incorrecto'})).status,403);
    assert.equal((await f.request(`announcements/${id}?community=plaza`,'PATCH',{action:'dismiss'},resident)).status,403);
    assert.equal((await f.request(path,'PATCH',{action:'dismiss',residentId:other.user.id},resident)).status,200);
    assert.ok(!(await state(resident)).announcements.some(a=>a.id===id));
    assert.ok((await state(other)).announcements.some(a=>a.id===id));assert.ok((await state(admin)).announcements.some(a=>a.id===id));
    assert.equal((await f.request(path,'PATCH',{action:'dismiss'},resident)).status,200);
    await f.request(path,'PATCH',{action:'edit',title:'Título revisado',body:'Aviso revisado por administración'},admin);
    assert.ok(!(await state(resident)).announcements.some(a=>a.id===id));
    const urgent=(await f.request('announcements?community=olivos','POST',{title:'Urgencia ficticia',body:'Aviso urgente de prueba',urgency:'urgent'},admin)).body;
    assert.equal((await f.request(`announcements/${urgent.id}?community=olivos`,'PATCH',{action:'dismiss'},resident)).status,200);
    assert.ok(!(await state(resident)).announcements.some(a=>a.id===urgent.id));
    assert.equal((await state(admin)).announcements.find(a=>a.id===urgent.id).active,true);
    await f.restart();resident=await f.login('vecino.olivos');
    const after=await state(resident);assert.ok(!after.announcements.some(a=>a.id===id||a.id===urgent.id));assert.equal(after.documents.length,initial.documents.length);
    assert.equal((await f.request('announcements/inexistente?community=olivos','PATCH',{action:'dismiss'},resident)).status,404);
  }finally{await f.close();}
});

test('Avisos particulares de administración: destinatario, comunidad, lectura y persistencia', async () => {
  const f=await fixture();
  try {
    let admin=await f.login('admin.olivos'),resident=await f.login('vecino.olivos');
    const other=await f.login('vecino.olivos2'),plaza=await f.login('vecino.plaza');
    const initial=(await f.request('state?community=olivos','GET',undefined,admin)).body;
    assert.equal(initial.residents.length,2);assert.ok(initial.residents.every(r=>!r.passwordHash&&!r.salt&&!r.username));
    const neighborState=(await f.request('state?community=olivos','GET',undefined,resident)).body;assert.equal(neighborState.residents,undefined);
    const body={recipientId:resident.user.id,subject:'Recogida de llave ficticia',message:'Puedes recoger la llave de demostración en administración.',senderId:other.user.id};
    assert.equal((await f.request('neighbor-messages?community=olivos','POST',body,resident)).status,403);
    assert.equal((await f.request('neighbor-messages?community=olivos','POST',body,admin,{'X-CSRF-Token':'incorrecto'})).status,403);
    assert.equal((await f.request('neighbor-messages?community=plaza','POST',body,admin)).status,403);
    assert.equal((await f.request('neighbor-messages?community=olivos','POST',{...body,recipientId:plaza.user.id},admin)).status,400);
    assert.equal((await f.request('neighbor-messages?community=olivos','POST',{...body,recipientId:admin.user.id},admin)).status,400);
    const sent=await f.request('neighbor-messages?community=olivos','POST',body,admin);assert.equal(sent.status,201);assert.equal(sent.body.senderId,admin.user.id);assert.equal(sent.body.readAt,null);
    const id=sent.body.id,path=`neighbor-messages/${id}?community=olivos`;
    assert.equal((await f.request('state?community=olivos','GET',undefined,resident)).body.neighborMessages.length,1);
    assert.equal((await f.request('state?community=olivos','GET',undefined,other)).body.neighborMessages.length,0);
    assert.equal((await f.request('state?community=plaza','GET',undefined,plaza)).body.neighborMessages.length,0);
    assert.equal((await f.request(path,'PATCH',{action:'read'},admin)).status,403);
    assert.equal((await f.request(path,'PATCH',{action:'read'},other)).status,403);
    const read=await f.request(path,'PATCH',{action:'read'},resident);assert.equal(read.status,200);assert.ok(read.body.readAt);
    assert.equal((await f.request(path,'PATCH',{action:'read'},resident)).body.readAt,read.body.readAt);
    await f.request('tickets/clear-completed?community=olivos','POST',{},admin);
    await f.restart();admin=await f.login('admin.olivos');resident=await f.login('vecino.olivos');
    const state=(await f.request('state?community=olivos','GET',undefined,admin)).body;assert.equal(state.neighborMessages[0].id,id);assert.equal(state.neighborMessages[0].readAt,read.body.readAt);
    assert.equal(state.serviceRequests,undefined);assert.equal((await f.request('service-requests','GET',undefined,admin)).status,403);
  }finally{await f.close();}
});

test('Editar y eliminar avisos ordinarios, incluidos precargados, sin reaparecer tras reiniciar', async () => {
  const f = await fixture();
  try {
    let admin=await f.login('admin.olivos');const resident=await f.login('vecino.olivos'),manager=await f.login('gestion');
    const state = async (session=admin,community='olivos') => (await f.request(`state?community=${community}`,'GET',undefined,session)).body;
    const initial=await state();const seed=initial.announcements[0];
    const path=`announcements/${seed.id}?community=olivos`, edit={action:'edit',title:'Horario actualizado',body:'Nuevo horario ficticio.'};
    assert.equal((await f.request(path,'PATCH',edit,resident)).status,403);
    assert.equal((await f.request(path,'PATCH',edit,admin,{'X-CSRF-Token':'incorrecto'})).status,403);
    assert.equal((await f.request(`announcements/${seed.id}?community=plaza`,'PATCH',edit,admin)).status,403);
    assert.equal((await f.request(`announcements/${seed.id}?community=plaza`,'PATCH',edit,manager)).status,404);
    assert.equal((await f.request(path,'PATCH',{...edit,title:''},admin)).status,400);
    assert.equal((await f.request(path,'PATCH',edit,admin)).status,200);
    let visible=await state(resident);assert.equal(visible.announcements.filter(a=>a.id===seed.id).length,1);assert.equal(visible.announcements.find(a=>a.id===seed.id).title,edit.title);
    await f.restart();admin=await f.login('admin.olivos');assert.equal((await state()).announcements.find(a=>a.id===seed.id).body,edit.body);
    assert.equal((await f.request(path,'PATCH',{action:'delete'},admin)).status,200);
    assert.ok(!(await state()).announcements.some(a=>a.id===seed.id));
    await f.restart();admin=await f.login('admin.olivos');assert.ok(!(await state()).announcements.some(a=>a.id===seed.id));
    assert.equal((await f.request(path,'PATCH',{action:'delete'},admin)).status,404);
    const created=(await f.request('announcements?community=olivos','POST',{title:'Nueva ficha',body:'Contenido nuevo'},admin)).body;
    assert.equal((await f.request(`announcements/${created.id}?community=olivos`,'PATCH',edit,admin)).status,200);
    assert.equal((await f.request(`announcements/${created.id}?community=olivos`,'PATCH',{action:'delete'},admin)).status,200);
    const urgent=(await f.request('announcements?community=olivos','POST',{title:'Urgente ficticio',body:'Contenido urgente',urgency:'urgent'},admin)).body;
    assert.equal((await f.request(`announcements/${urgent.id}?community=olivos`,'PATCH',{action:'delete'},admin)).status,400);
    assert.ok((await state()).announcements.some(a=>a.id===urgent.id));
    assert.equal((await state(await f.login('administrador'),'plaza')).announcements.length,2);
    assert.equal((await state()).documents.length,initial.documents.length);
  } finally {await f.close();}
});

test('Avisos ordinarios y urgentes: permisos, simulación por comunidad, finalización y persistencia', async () => {
  const f = await fixture();
  try {
    const admin = await f.login('admin.olivos'), resident = await f.login('vecino.olivos'), plaza = await f.login('vecino.plaza');
    const notice = {title:'Aviso ficticio',body:'Comunicado de demostración'};
    const post = (body, session=admin, community='olivos') => f.request(`announcements?community=${community}`,'POST',body,session);
    assert.equal((await post(notice,resident)).status,403);
    assert.equal((await post(notice,admin,'plaza')).status,403);
    assert.equal((await post({...notice,urgency:'inválida'})).status,400);
    assert.equal((await f.request('announcements?community=olivos','POST',notice,admin,{'X-CSRF-Token':'incorrecto'})).status,403);
    const ordinary = await post(notice); assert.equal(ordinary.status,201); assert.equal(ordinary.body.urgency,'ordinary'); assert.equal(ordinary.body.emailNotification,undefined);
    const urgent = await post({...notice,title:'Incidencia ficticia de agua caliente',urgency:'urgent'});
    assert.equal(urgent.status,201); assert.equal(urgent.body.active,true);
    assert.equal(urgent.body.emailNotification.mode,'simulation'); assert.equal(urgent.body.emailNotification.recipientCount,2); assert.equal(urgent.body.emailNotification.sentCount,0);
    const id=urgent.body.id, path=`announcements/${id}?community=olivos`;
    const state=(await f.request('state?community=olivos','GET',undefined,resident)).body;
    const visible=state.announcements.find(a=>a.id===id); assert.equal(visible.urgency,'urgent'); assert.equal(visible.emailNotification,undefined);
    assert.ok(!(await f.request('state?community=plaza','GET',undefined,plaza)).body.announcements.some(a=>a.id===id));
    assert.equal((await f.request(path,'PATCH',{action:'end'},resident)).status,403);
    assert.equal((await f.request(`announcements/${id}?community=plaza`,'PATCH',{action:'end'},await f.login('administrador'))).status,404);
    assert.equal((await f.request(path,'PATCH',{action:'end'},admin)).body.active,false);
    assert.equal((await f.request(`announcements/${ordinary.body.id}?community=olivos`,'PATCH',{action:'end'},admin)).status,400);
    await f.restart();const manager=await f.login('gestion');
    const final=(await f.request('state?community=olivos','GET',undefined,manager)).body.announcements.find(a=>a.id===id);
    assert.equal(final.active,false); assert.ok(final.endedAt); assert.equal(final.emailNotification.recipientCount,2);
    const second=await post({...notice,urgency:'urgent'},manager,'plaza');assert.equal(second.body.emailNotification.recipientCount,1);
  } finally {await f.close();}
});

test('Eliminar completadas solo borra resueltas de la comunidad autorizada y persiste', async () => {
  const f = await fixture();
  try {
    let admin = await f.login('admin.olivos');
    const resident = await f.login('vecino.olivos'), manager = await f.login('gestion');
    const create = async (community, subject, session = resident) => (await f.request(`tickets?community=${community}`, 'POST', { ...draft, subject }, session)).body;
    const pending = await create('olivos', 'Pendiente');
    const active = await create('olivos', 'En curso');
    const done = await create('olivos', 'Terminada');
    const other = await create('plaza', 'Otra comunidad', manager);
    const change = (item, community, status, session) => f.request(`tickets/${item.id}?community=${community}`, 'PATCH', { status, reply: 'Respuesta ficticia' }, session);
    await change(active, 'olivos', 'En revisión', admin); await change(done, 'olivos', 'Resuelta', admin); await change(other, 'plaza', 'Resuelta', manager);
    await f.request('service-requests?community=olivos', 'POST', { subject: 'Particular', message: 'Consulta privada ficticia', category: 'Gas' }, resident);
    const path = 'tickets/clear-completed?community=olivos';
    assert.equal((await f.request(path, 'POST', {})).status, 401);
    assert.equal((await f.request(path, 'POST', {}, resident)).status, 403);
    assert.equal((await f.request(path, 'POST', {}, admin, {'X-CSRF-Token':'incorrecto'})).status, 403);
    assert.equal((await f.request('tickets/clear-completed?community=plaza', 'POST', {}, admin)).status, 403);
    assert.deepEqual((await f.request(path, 'POST', {}, admin)).body, {removed:1});
    let state = (await f.request('state?community=olivos', 'GET', undefined, admin)).body;
    assert.deepEqual(new Set(state.tickets.map(t=>t.id)), new Set([pending.id, active.id]));
    assert.ok(state.documents.length); assert.ok(state.advice.length);
    const plaza = (await f.request('state?community=plaza', 'GET', undefined, manager)).body;
    assert.ok(plaza.tickets.some(t=>t.id===other.id));
    assert.equal((await f.request('service-requests', 'GET', undefined, manager)).body.length,1);
    assert.deepEqual((await f.request(path, 'POST', {}, admin)).body, {removed:0});
    await f.restart(); admin = await f.login('admin.olivos');
    state = (await f.request('state?community=olivos', 'GET', undefined, admin)).body;
    assert.equal(state.tickets.length,2); assert.ok(!state.tickets.some(t=>t.id===done.id));
    assert.deepEqual((await f.request('tickets/clear-completed?community=plaza', 'POST', {}, await f.login('gestion'))).body,{removed:1});
  } finally { await f.close(); }
});

test('Contenidos: permisos, revisión, publicación, edición, retirada y persistencia', async () => {
  const f = await fixture();
  try {
    let admin = await f.login('admin.olivos'), resident = await f.login('vecino.olivos');
    const item = { title: 'Ficha ficticia de gas', body: 'Información ilustrativa sin ofertas reales.', kind: 'Consejos', category: 'Gas' };
    assert.equal((await f.request('advice?community=olivos', 'POST', item)).status, 401);
    assert.equal((await f.request('advice?community=olivos', 'POST', item, resident)).status, 403);
    assert.equal((await f.request('advice?community=plaza', 'POST', item, admin)).status, 403);
    assert.equal((await f.request('advice?community=olivos', 'POST', { ...item, kind: 'Inválida' }, admin)).status, 400);
    const created = await f.request('advice?community=olivos', 'POST', item, admin);
    assert.equal(created.status, 201); assert.equal(created.body.status, 'draft');
    const id = created.body.id, path = `advice/${id}?community=olivos`;
    const visible = async session => (await f.request('state?community=olivos', 'GET', undefined, session)).body.advice.find(a => a.id === id);
    assert.equal(await visible(resident), undefined); assert.ok(await visible(admin));
    assert.equal((await f.request(path, 'PATCH', { action: 'publish', reviewed: true }, resident)).status, 403);
    assert.equal((await f.request(path, 'PATCH', { action: 'publish' }, admin)).status, 400);
    assert.equal((await f.request(`advice/${id}?community=plaza`, 'PATCH', { action: 'publish', reviewed: true }, await f.login('administrador'))).status, 404);
    assert.equal((await f.request(path, 'PATCH', { action: 'publish', reviewed: true }, admin)).status, 200);
    assert.equal((await visible(resident)).title, item.title);
    assert.equal((await f.request(path, 'PATCH', { ...item, action: 'edit' }, admin)).status, 409);
    await f.restart(); admin = await f.login('admin.olivos'); resident = await f.login('vecino.olivos');
    assert.equal((await visible(resident)).status, 'published');
    assert.equal((await f.request(path, 'PATCH', { action: 'withdraw' }, admin)).status, 200);
    assert.equal(await visible(resident), undefined);
    assert.equal((await f.request(path, 'PATCH', { ...item, title: 'Ficha revisada', action: 'edit' }, admin)).body.status, 'draft');
    const manager = await f.login('gestion');
    assert.equal((await f.request(path, 'PATCH', { action: 'publish', reviewed: true }, manager)).status, 200);
    assert.equal((await visible(resident)).title, 'Ficha revisada');
  } finally { await f.close(); }
});

test('Identificación, cookies, CSRF, credenciales y cierre de sesión', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('communities')).status, 401);
    assert.equal((await f.request('state?community=olivos')).status, 401);
    assert.equal((await f.request('login', 'POST', { username: 'vecino.olivos', password: 'incorrecta' })).status, 401);
    assert.equal((await f.request('login', 'POST', { username: 'no-existe', password: 'incorrecta' })).status, 401);
    const account = demoAccounts[0];
    const crossSite = await f.request('login', 'POST', { username: account.username, password: account.password }, undefined, { Origin: 'https://otro-sitio.invalid' });
    assert.equal(crossSite.status, 403);
    const login = await f.request('login', 'POST', { username: account.username, password: account.password });
    assert.equal(login.status, 200); assert.match(login.cookie, /HttpOnly/); assert.match(login.cookie, /SameSite=Strict/);
    assert.ok(!('passwordHash' in login.body.user)); assert.ok(!('salt' in login.body.user));
    const session = { cookie: login.cookie.split(';')[0], csrfToken: login.body.csrfToken };
    assert.equal((await f.request('session', 'GET', undefined, session)).status, 200);
    assert.equal((await f.request('tickets?community=olivos', 'POST', draft, session, { 'X-CSRF-Token': '' })).status, 403);
    assert.equal((await f.request('tickets?community=olivos', 'POST', draft, session, { Origin: 'https://otro-sitio.invalid' })).status, 403);
    const logout = await f.request('logout', 'POST', {}, session);
    assert.equal(logout.status, 200); assert.match(logout.cookie, /Max-Age=0/);
    assert.equal((await f.request('session', 'GET', undefined, session)).status, 401);
    const stored = readFileSync(join(f.dir, 'users.json'), 'utf8');
    for (const a of demoAccounts) assert.ok(!stored.includes(a.password));
  } finally { await f.close(); }
});

test('Autorización real por rol, comunidad y propietario de la consulta', async () => {
  const f = await fixture();
  try {
    const ana = await f.login('vecino.olivos'), luis = await f.login('vecino.olivos2');
    const admin = await f.login('administrador'), limitedAdmin = await f.login('admin.olivos');
    const manager = await f.login('gestion');
    assert.deepEqual((await f.request('communities', 'GET', undefined, ana)).body.map(c => c.id), ['olivos']);
    assert.equal((await f.request('state?community=plaza', 'GET', undefined, ana)).status, 403);
    assert.equal((await f.request('ask?community=plaza', 'POST', { question: '¿Hay piscina?' }, ana)).status, 403);
    assert.equal((await f.request('tickets?community=plaza', 'POST', draft, ana)).status, 403);
    assert.equal((await f.request('state?community=plaza', 'GET', undefined, limitedAdmin)).status, 403);
    assert.equal((await f.request('communities', 'GET', undefined, admin)).body.length, 2);
    assert.equal((await f.request('communities', 'GET', undefined, manager)).body.length, 2);
    const created = await f.request('tickets?community=olivos', 'POST', { ...draft, residentId: luis.user.id, role: 'admin' }, ana);
    assert.equal(created.status, 201); assert.equal(created.body.residentId, ana.user.id);
    const id = created.body.id;
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, ana)).body.tickets.length, 1);
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, luis)).body.tickets.length, 0);
    assert.equal((await f.request(`tickets/${id}?community=olivos`, 'PATCH', { status: 'Resuelta', reply: 'Intento' }, ana)).status, 403);
    assert.equal((await f.request('announcements?community=olivos', 'POST', { title: 'Intento', body: 'Contenido' }, ana)).status, 403);
    assert.equal((await f.request(`tickets/${id}?community=plaza`, 'PATCH', { status: 'Resuelta', reply: 'Intento' }, admin)).status, 404);
    assert.equal((await f.request(`tickets/${id}?community=olivos`, 'PATCH', { status: 'Resuelta', reply: 'Revisado en demo' }, admin)).status, 200);
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, ana)).body.tickets[0].reply, 'Revisado en demo');
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, luis)).body.tickets.length, 0);
    assert.equal((await f.request('announcements?community=plaza', 'POST', { title: 'Gestión', body: 'Aviso de prueba' }, manager)).status, 201);
  } finally { await f.close(); }
});

test('Persistencia de consultas y avisos; reidentificación después de reiniciar', async () => {
  const f = await fixture();
  try {
    const ana = await f.login('vecino.olivos'), admin = await f.login('administrador');
    const created = await f.request('tickets?community=olivos', 'POST', draft, ana);
    assert.equal((await f.request(`tickets/${created.body.id}?community=olivos`, 'PATCH', { status: 'Resuelta', reply: 'Respuesta persistente' }, admin)).status, 200);
    const aviso = await f.request('announcements?community=olivos', 'POST', { title: 'Aviso', body: 'Contenido ficticio' }, admin);
    assert.equal((await f.request('tickets?community=olivos', 'POST', { ...draft, subject: '' }, ana)).status, 400);
    assert.equal((await f.request('tickets?community=olivos', 'POST', null, ana)).status, 400);
    await f.restart();
    assert.equal((await f.request('session', 'GET', undefined, ana)).status, 401);
    const again = await f.login('vecino.olivos');
    const state = (await f.request('state?community=olivos', 'GET', undefined, again)).body;
    assert.equal(state.tickets[0].reply, 'Respuesta persistente');
    assert.ok(state.announcements.some(a => a.id === aviso.body.id));
  } finally { await f.close(); }
});

test('Fuentes del asistente restringidas a comunidades autorizadas', async () => {
  const f = await fixture();
  try {
    const admin = await f.login('administrador');
    const ask = async (community, question) => (await f.request(`ask?community=${community}`, 'POST', { question }, admin)).body;
    const olivos = await ask('olivos', '¿Hay piscina?'), plaza = await ask('plaza', '¿Hay piscina?');
    assert.ok(olivos.source.id.startsWith('olivos-')); assert.ok(plaza.source.id.startsWith('plaza-'));
    assert.match(olivos.answer, /10:00/); assert.match(plaza.answer, /no dispone/);
    assert.equal((await ask('olivos', '¿Cuándo es la reunión?')).unresolved, false);
    assert.equal((await ask('olivos', '¿Cuál es mi deuda particular?')).unresolved, true);
    assert.equal((await ask('olivos', '¿Cuándo es la junta y cuánto cuesta la cuota?')).unresolved, true);
  } finally { await f.close(); }
});

test('Solicitudes de documentos privadas, validación de canales y confirmación manual', async () => {
  const f = await fixture();
  try {
    const ana = await f.login('vecino.olivos'), luis = await f.login('vecino.olivos2'), admin = await f.login('administrador');
    const draft = { documentId: 'olivos-normas', channel: 'email', destination: 'vecino@example.com' };
    const created = await f.request('document-requests?community=olivos', 'POST', { ...draft, residentId: luis.user.id }, ana);
    assert.equal(created.status, 201); assert.equal(created.body.residentId, ana.user.id); assert.equal(created.body.status, 'Pendiente');
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, luis)).body.documentRequests.length, 0);
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, admin)).body.documentRequests.length, 1);
    assert.equal((await f.request('document-requests?community=olivos', 'POST', { ...draft, documentId: 'plaza-normas' }, ana)).status, 404);
    assert.equal((await f.request('document-requests?community=plaza', 'POST', { ...draft, documentId: 'plaza-normas' }, ana)).status, 403);
    assert.equal((await f.request('document-requests?community=olivos', 'POST', { ...draft, destination: 'correo\nincorrecto' }, ana)).status, 400);
    assert.equal((await f.request('document-requests?community=olivos', 'POST', { ...draft, channel: 'whatsapp', destination: '+34000000000' }, ana)).status, 201);
    assert.equal((await f.request('document-requests?community=olivos', 'POST', { ...draft, channel: 'whatsapp', destination: 'teléfono' }, ana)).status, 400);
    const path = `document-requests/${created.body.id}?community=olivos`;
    assert.equal((await f.request(path, 'PATCH', { status: 'Envío confirmado por gestor' }, ana)).status, 403);
    assert.equal((await f.request(path.replace('olivos', 'plaza'), 'PATCH', { status: 'Envío confirmado por gestor' }, admin)).status, 404);
    assert.equal((await f.request(path, 'PATCH', { status: 'Entregado automáticamente' }, admin)).status, 400);
    assert.equal((await f.request(path, 'PATCH', { status: 'Envío confirmado por gestor' }, admin)).status, 200);
    await f.restart(); const again = await f.login('vecino.olivos');
    const state = (await f.request('state?community=olivos', 'GET', undefined, again)).body;
    assert.equal(state.documentRequests.find(r => r.id === created.body.id).status, 'Envío confirmado por gestor');
  } finally { await f.close(); }
});

test('Descarga PDF protegida por sesión y comunidad', async () => {
  const f = await fixture();
  try {
    const ana = await f.login('vecino.olivos');
    assert.equal((await f.download('documents/olivos-normas/download?community=olivos')).status, 401);
    assert.equal((await f.download('documents/plaza-normas/download?community=plaza', ana)).status, 403);
    assert.equal((await f.download('documents/plaza-normas/download?community=olivos', ana)).status, 404);
    const pdf = await f.download('documents/olivos-normas/download?community=olivos', ana);
    assert.equal(pdf.status, 200); assert.equal(pdf.type, 'application/pdf');
    assert.match(pdf.disposition, /olivos-normas\.pdf/); assert.ok(pdf.data.subarray(0, 8).toString().startsWith('%PDF-1.4'));
  } finally { await f.close(); }
});

test('Consultas particulares: privadas por autor, inaccesibles al administrador y respondidas por gestión', async () => {
  const f = await fixture();
  try {
    const ana = await f.login('vecino.olivos'), luis = await f.login('vecino.olivos2'), marta = await f.login('vecino.plaza');
    const admin = await f.login('administrador'), manager = await f.login('gestion');
    const privateDraft = { category: 'Gas', subject: 'Tarifa individual ficticia', message: 'Duda particular sobre mi contrato de gas ficticio' };
    assert.equal((await f.request('service-requests')).status, 401);
    assert.equal((await f.request('service-requests?community=olivos', 'POST', privateDraft, admin)).status, 403);
    assert.equal((await f.request('service-requests?community=plaza', 'POST', privateDraft, ana)).status, 403);
    assert.equal((await f.request('service-requests?community=olivos', 'POST', { ...privateDraft, category: 'No existe' }, ana)).status, 400);
    assert.equal((await f.request('service-requests?community=olivos', 'POST', { ...privateDraft, subject: '' }, ana)).status, 400);
    const created = await f.request('service-requests?community=olivos', 'POST', { ...privateDraft, residentId: luis.user.id, role: 'manager' }, ana);
    assert.equal(created.status, 201); assert.equal(created.body.residentId, ana.user.id);
    assert.equal((await f.request('service-requests', 'GET', undefined, ana)).body.length, 1);
    assert.equal((await f.request('service-requests', 'GET', undefined, luis)).body.length, 0);
    assert.equal((await f.request('service-requests', 'GET', undefined, marta)).body.length, 0);
    assert.equal((await f.request('service-requests', 'GET', undefined, admin)).status, 403);
    const commonState = await f.request('state?community=olivos', 'GET', undefined, admin);
    assert.equal(commonState.body.tickets.length, 0);
    assert.ok(!JSON.stringify(commonState.body).includes(privateDraft.subject));
    const id = created.body.id, patch = { status: 'Resuelta', reply: 'Orientación ficticia de Gestión VecinoIA' };
    assert.equal((await f.request(`service-requests/${id}?community=olivos`, 'PATCH', patch, admin)).status, 403);
    assert.equal((await f.request(`service-requests/${id}?community=olivos`, 'PATCH', patch, ana)).status, 403);
    assert.equal((await f.request(`tickets/${id}?community=olivos`, 'PATCH', patch, admin)).status, 404);
    assert.equal((await f.request('tickets?community=olivos', 'POST', { ...draft, category: 'Gas' }, ana)).status, 400);
    assert.equal((await f.request(`service-requests/${id}?community=plaza`, 'PATCH', patch, manager)).status, 404);
    assert.equal((await f.request(`service-requests/${id}?community=olivos`, 'PATCH', { ...patch, status: 'Incorrecto' }, manager)).status, 400);
    assert.equal((await f.request(`service-requests/${id}?community=olivos`, 'PATCH', patch, manager)).status, 200);
    assert.equal((await f.request('service-requests', 'GET', undefined, ana)).body[0].reply, patch.reply);
    await f.request('service-requests?community=plaza', 'POST', { ...privateDraft, category: 'Luz', subject: 'Luz de Plaza Mayor' }, marta);
    const inbox = (await f.request('service-requests', 'GET', undefined, manager)).body;
    assert.equal(inbox.length, 2); assert.ok(inbox.some(r => r.communityName === 'Comunidad Plaza Mayor'));
    const accountFile = join(f.dir, 'users.json'), accounts = JSON.parse(readFileSync(accountFile, 'utf8'));
    accounts.find(u => u.role === 'manager').communityIds = ['olivos']; writeFileSync(accountFile, JSON.stringify(accounts));
    await f.restart(); const again = await f.login('vecino.olivos'), limitedManager = await f.login('gestion');
    assert.equal((await f.request('service-requests', 'GET', undefined, again)).body[0].status, 'Resuelta');
    assert.equal((await f.request('service-requests', 'GET', undefined, limitedManager)).body.length, 1);
    assert.equal((await f.request('service-requests/no-existe?community=plaza', 'PATCH', patch, limitedManager)).status, 403);
  } finally { await f.close(); }
});

test('Migración de servicios antiguos sin pérdida de consultas ni exposición al administrador', async () => {
  const f = await fixture();
  try {
    const ana = await f.login('vecino.olivos');
    await f.request('tickets?community=olivos', 'POST', draft, ana);
    const file = join(f.dir, 'demo.json'), store = JSON.parse(readFileSync(file, 'utf8'));
    store.tickets.push({ ...draft, id: 'legacy-service', communityId: 'olivos', residentId: ana.user.id, resident: ana.user.name, category: 'Energía', subject: 'Antigua petición privada', status: 'En revisión', reply: 'Respuesta conservada', createdAt: '2026-10-13T18:00:00Z' });
    writeFileSync(file, JSON.stringify(store)); await f.restart();
    const admin = await f.login('administrador'), again = await f.login('vecino.olivos');
    const common = (await f.request('state?community=olivos', 'GET', undefined, admin)).body;
    assert.equal(common.tickets.length, 1); assert.ok(!JSON.stringify(common).includes('Antigua petición privada'));
    const services = (await f.request('service-requests', 'GET', undefined, again)).body;
    assert.equal(services.length, 1); assert.equal(services[0].id, 'legacy-service'); assert.equal(services[0].category, 'Luz y gas'); assert.equal(services[0].reply, 'Respuesta conservada');
    await f.restart(); const onceMore = await f.login('vecino.olivos');
    assert.equal((await f.request('service-requests', 'GET', undefined, onceMore)).body.length, 1);
  } finally { await f.close(); }
});

test('Documentos: borrador privado, publicación revisada, consulta con fuente y retirada', async () => {
  const f = await fixture();
  try {
    const admin = await f.login('administrador'), ana = await f.login('vecino.olivos'), manager = await f.login('gestion');
    const bytes = readFileSync(new URL('../examples/documentos/normas-gimnasio.txt', import.meta.url));
    assert.equal((await f.upload('normas.txt', bytes, 'Gimnasio', ana)).status, 403);
    const upload = await f.upload('normas.txt', bytes, 'Gimnasio ficticio', admin);
    assert.equal(upload.status, 201); assert.equal(upload.body.status, 'draft'); assert.equal(upload.body.processingStatus, 'ready');
    assert.ok(!('storageName' in upload.body)); assert.ok(!('uploadedBy' in upload.body));
    const id = upload.body.id, path = `documents/${id}?community=olivos`;
    let residentState = (await f.request('state?community=olivos', 'GET', undefined, ana)).body;
    assert.ok(!residentState.documents.some(d => d.id === id)); assert.ok(!('managedDocuments' in residentState)); assert.ok(!('faqs' in residentState));
    assert.equal((await f.download(`documents/${id}/download?community=olivos`, ana)).status, 404);
    assert.equal((await f.request('document-requests?community=olivos', 'POST', { documentId: id, channel: 'email', destination: 'vecino@example.com' }, ana)).status, 404);
    assert.equal((await f.request(path, 'PATCH', { action: 'publish' }, admin)).status, 409);
    assert.equal((await f.request(path, 'PATCH', { action: 'publish', reviewed: true }, ana)).status, 403);
    assert.equal((await f.request(path, 'PATCH', { action: 'publish', reviewed: true }, manager)).status, 200);
    residentState = (await f.request('state?community=olivos', 'GET', undefined, ana)).body;
    assert.ok(residentState.documents.some(d => d.id === id));
    const download = await f.download(`documents/${id}/download?community=olivos`, ana);
    assert.equal(download.status, 200); assert.ok(download.data.equals(bytes));
    const ask = (await f.request('ask?community=olivos', 'POST', { question: '¿Cuándo cierra el gimnasio?' }, ana)).body;
    assert.equal(ask.unresolved, false); assert.equal(ask.source.id, id); assert.match(ask.answer, /22:00/);
    for (const question of ['¿Cuándo cierra el gym?', '¿A qué hora cierra el GYM?', '¿Cuándo cierra el gimnasio?', '¿Cuándo cierra el gym, gimnasio?']) {
      const result = (await f.request('ask?community=olivos', 'POST', { question }, ana)).body;
      assert.equal(result.unresolved, false, question); assert.equal(result.source.id, id); assert.match(result.answer, /22:00/);
    }
    const otherCommunity = await f.request('ask?community=plaza', 'POST', { question: '¿Cuándo cierra el gym?' }, admin);
    assert.equal(otherCommunity.body.unresolved, true);
    const request = await f.request('document-requests?community=olivos', 'POST', { documentId: id, channel: 'email', destination: 'vecino@example.com' }, ana);
    assert.equal(request.status, 201);
    assert.equal((await f.request(path, 'PATCH', { action: 'withdraw' }, admin)).status, 200);
    assert.equal((await f.download(`documents/${id}/download?community=olivos`, ana)).status, 404);
    assert.equal((await f.request('ask?community=olivos', 'POST', { question: '¿Cuándo cierra el gimnasio?' }, ana)).body.unresolved, true);
    assert.equal((await f.request('ask?community=olivos', 'POST', { question: '¿Cuándo cierra el gym?' }, ana)).body.unresolved, true);
    assert.equal((await f.request(`document-requests/${request.body.id}?community=olivos`, 'PATCH', { status: 'Envío confirmado por gestor' }, admin)).status, 409);
    await f.restart(); const again = await f.login('administrador');
    assert.equal((await f.request('state?community=olivos', 'GET', undefined, again)).body.managedDocuments.find(d => d.id === id).status, 'withdrawn');
  } finally { await f.close(); }
});

test('Carga de PDF y Word, original conservado y permisos por comunidad', async () => {
  const f = await fixture();
  try {
    const admin = await f.login('administrador'), limited = await f.login('admin.olivos'), ana = await f.login('vecino.olivos');
    const body = 'El gimnasio cierra a las 22:00 todos los días. Solo datos ficticios.';
    const bytes = documentPDF({ name: 'Los Olivos' }, { title: 'Normas ficticias', body, updated: '2026-10-14' });
    const pdf = await f.upload('normas.pdf', bytes, 'PDF ficticio', admin);
    assert.equal(pdf.status, 201); assert.equal(pdf.body.processingStatus, 'ready', pdf.body.processingError); assert.match(pdf.body.body, /gimnasio/);
    // Eliminar los operadores de texto conservando longitud y offsets del PDF.
    const blankPdf = Buffer.from(bytes.toString('latin1').replace(/\([^)]*\) Tj/g, match => ' '.repeat(match.length)), 'latin1');
    const scan = await f.upload('sin-texto.pdf', blankPdf, 'PDF sin texto', admin);
    assert.equal(scan.body.processingStatus, 'error'); assert.match(scan.body.processingError, /OCR/);
    const docxBytes = readFileSync(new URL('../examples/documentos/normas-gimnasio.docx', import.meta.url));
    const word = await f.upload('normas.docx', docxBytes, 'Word ficticio', admin, 'plaza');
    assert.equal(word.status, 201); assert.equal(word.body.processingStatus, 'ready', word.body.processingError); assert.match(word.body.body, /todos los días/);
    assert.equal((await f.upload('normas.docx', docxBytes, 'No autorizado', limited, 'plaza')).status, 403);
    assert.equal((await f.request(`documents/${word.body.id}?community=olivos`, 'PATCH', { action: 'publish', reviewed: true }, admin)).status, 404);
    assert.equal((await f.download(`documents/${word.body.id}/download?community=plaza`, ana)).status, 403);
    const original = await f.download(`documents/${word.body.id}/download?community=plaza`, admin);
    assert.ok(original.data.equals(docxBytes)); assert.match(original.type, /wordprocessingml/);
    const state = (await f.request('state?community=plaza', 'GET', undefined, admin)).body;
    assert.ok(!state.managedDocuments.some(d => d.id === pdf.body.id));
  } finally { await f.close(); }
});

test('Documentos dañados no publicables, límites de archivo y retirada de fuentes FAQ', async () => {
  const f = await fixture();
  try {
    const admin = await f.login('administrador'), ana = await f.login('vecino.olivos');
    assert.equal((await f.upload('programa.exe', Buffer.from('contenido ficticio'), 'Archivo', admin)).status, 415);
    assert.equal((await f.upload('grande.txt', Buffer.alloc(5 * 1024 * 1024 + 1, 65), 'Demasiado grande', admin)).status, 413);
    assert.equal((await f.upload('vacio.txt', Buffer.alloc(0), 'Vacío', admin)).status, 400);
    const bad = await f.upload('incorrecto.pdf', Buffer.from('esto no es un PDF'), 'PDF dañado', admin);
    assert.equal(bad.status, 201); assert.equal(bad.body.processingStatus, 'error'); assert.equal(bad.body.status, 'draft');
    assert.equal((await f.request(`documents/${bad.body.id}?community=olivos`, 'PATCH', { action: 'publish', reviewed: true }, admin)).status, 409);
    assert.equal((await f.upload('incorrecto.docx', Buffer.from('esto no es un DOCX'), 'Word dañado', admin)).body.processingStatus, 'error');
    assert.equal((await f.request('documents/olivos-normas?community=olivos', 'PATCH', { action: 'withdraw' }, admin)).status, 200);
    assert.equal((await f.request('ask?community=olivos', 'POST', { question: '¿Hay piscina?' }, ana)).body.unresolved, true);
    const state = (await f.request('state?community=olivos', 'GET', undefined, ana)).body;
    assert.ok(!JSON.stringify(state).includes('La piscina abre'));
  } finally { await f.close(); }
});

const poolModelResponse = () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ sufficient: true, answer: 'La piscina abre de 10:00 a 21:00 en temporada de verano.', citations: [{ document_id: 'olivos-normas', quote: 'La piscina abre de 10:00 a 21:00 durante la temporada de verano.' }] }) }] }] }) });

test('IA: contexto privado por comunidad y límite de veinte consultas por usuario', async () => {
  let calls = 0;
  const ai = createAssistant({ apiKey: 'ficticia', fetchImpl: async (_url, options) => {
    calls++;
    const context = JSON.parse(JSON.parse(options.body).input[0].content[0].text);
    assert.equal(context.community.id, 'olivos');
    assert.ok(context.sources.every(source => source.document_id.startsWith('olivos-')));
    assert.ok(!JSON.stringify(context).includes('Consulta particular privada de prueba'));
    return poolModelResponse();
  } });
  const f = await fixture(ai);
  try {
    const ana = await f.login('vecino.olivos');
    await f.request('service-requests?community=olivos', 'POST', { category: 'Gas', subject: 'Consulta particular privada de prueba', message: 'No debe enviarse al asistente' }, ana);
    assert.equal((await f.request('ask?community=plaza', 'POST', { question: 'Piscina' }, ana)).status, 403);
    assert.equal(calls, 0);
    for (let i = 0; i < 20; i++) {
      const answer = await f.request('ask?community=olivos', 'POST', { question: '¿Puedo bañarme por la tarde?' }, ana);
      assert.equal(answer.status, 200); assert.equal(answer.body.engine, 'openai'); assert.equal(answer.body.sources[0].id, 'olivos-normas');
    }
    assert.equal((await f.request('ask?community=olivos', 'POST', { question: '¿Puedo bañarme por la tarde?' }, ana)).status, 429);
    assert.equal(calls, 20);
  } finally { await f.close(); }
});

test('IA: una fuente retirada durante la respuesta no se devuelve al vecino', async () => {
  let release, started;
  const waiting = new Promise(resolve => { started = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const ai = createAssistant({ apiKey: 'ficticia', fetchImpl: async () => { started(); await gate; return poolModelResponse(); } });
  const f = await fixture(ai);
  try {
    const ana = await f.login('vecino.olivos'), admin = await f.login('administrador');
    const pending = f.request('ask?community=olivos', 'POST', { question: 'Piscina' }, ana);
    await waiting;
    assert.equal((await f.request('ask?community=olivos', 'POST', { question: 'Otra pregunta' }, ana)).status, 429);
    assert.equal((await f.request('documents/olivos-normas?community=olivos', 'PATCH', { action: 'withdraw' }, admin)).status, 200);
    release();
    const answer = await pending;
    assert.equal(answer.body.aiStatus, 'source_withdrawn'); assert.equal(answer.body.source, null); assert.equal(answer.body.unresolved, true);
  } finally { release(); await f.close(); }
});
