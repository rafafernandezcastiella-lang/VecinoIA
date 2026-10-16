import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import { communities } from './src/communities.mjs';
import { loadUsers, verifyPassword, publicUser, cookieToken } from './src/auth.mjs';
import { documentPDF } from './src/pdf.mjs';
import { documentView, extractDocument, maxFileSize, supportedExtensions } from './src/documents.mjs';
import { createAssistant } from './src/assistant.mjs';
import { adviceKinds, adviceCategories, seedAdvice } from './src/advice.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const categories = ['General', 'Incidencia', 'Recibos'];
const serviceCategories = ['Luz', 'Gas', 'Luz y gas', 'Seguros', 'Mantenimiento', 'Otras consultas'];
const statuses = ['Pendiente', 'En revisión', 'Resuelta'];
const files = {
  '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'], '/anpara.css': ['anpara.css', 'text/css'], '/auth.css': ['auth.css', 'text/css'],
  '/images/los-olivos.png': ['images/los-olivos.png', 'image/png'],
  '/images/plaza-mayor.png': ['images/plaza-mayor.png', 'image/png']
};

export function createApp({ dataFile = join(resolve(process.env.DATA_DIR || join(root, 'data')), 'demo.json'), assistant = createAssistant() } = {}) {
  let store = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : { tickets: [], announcements: [] };
  store.documentRequests ||= [];
  store.serviceRequests ||= [];
  store.advice ||= seedAdvice(communities);
  store.documents ||= communities.flatMap(c => c.documents.map(d => ({ ...d, communityId: c.id, status: 'published', processingStatus: 'ready', origin: 'demo', createdAt: '2026-10-13T00:00:00Z' })));
  const uploadsDir = join(dirname(dataFile), 'uploads');
  const publishedDocs = communityId => store.documents.filter(d => d.communityId === communityId && d.status === 'published' && d.processingStatus === 'ready');
  // Las antiguas consultas del catálogo pasan al canal privado sin perder datos.
  const legacyServices = store.tickets.filter(t => ['Energía', 'Seguros', 'Mantenimiento'].includes(t.category));
  if (legacyServices.length) {
    for (const item of legacyServices) if (!store.serviceRequests.some(r => r.id === item.id)) store.serviceRequests.push({ ...item, category: item.category === 'Energía' ? 'Luz y gas' : item.category });
    store.tickets = store.tickets.filter(t => !legacyServices.includes(t));
    save();
  }
  const users = loadUsers(join(dirname(dataFile), 'users.json'));
  const sessions = new Map();
  const attempts = new Map();
  const sessionDuration = 8 * 60 * 60 * 1000;
  const assistantWindows = new Map();
  const assistantActive = new Set();
  function save() {
    mkdirSync(dirname(dataFile), { recursive: true });
    writeFileSync(`${dataFile}.tmp`, JSON.stringify(store, null, 2));
    renameSync(`${dataFile}.tmp`, dataFile);
  }
  return createServer(async (req, res) => {
    const reply = (code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === '/healthz' && req.method === 'GET') return reply(200, { ok: true });
      if (!url.pathname.startsWith('/api/')) {
        const file = files[url.pathname];
        if (req.method !== 'GET' || !file) return reply(404, { error: 'No encontrado' });
        res.writeHead(200, { 'Content-Type': file[1].startsWith('image/') ? file[1] : `${file[1]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
        return res.end(readFileSync(join(root, 'public', file[0])));
      }
      const mutating = ['POST', 'PATCH'].includes(req.method);
      if (mutating && ((req.headers.origin && req.headers.origin !== url.origin) || req.headers['sec-fetch-site'] === 'cross-site')) return reply(403, { error: 'Origen de solicitud no autorizado' });
      let body;
      if (mutating && url.pathname !== '/api/documents/upload') {
        if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'Contenido JSON requerido' });
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 16384) return reply(413, { error: 'El contenido es demasiado grande' }); }
        try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Contenido JSON no válido' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'Contenido no válido' });
      }
      const now = Date.now();
      for (const [token, s] of sessions) if (s.expiresAt <= now) sessions.delete(token);
      for (const [key, item] of attempts) if (item.expiresAt <= now) attempts.delete(key);
      if (url.pathname === '/api/login' && req.method === 'POST') {
        const address = req.socket.remoteAddress;
        const attempt = attempts.get(address) || { count: 0, expiresAt: now + 15 * 60 * 1000 };
        if (attempt.count >= 10) return reply(429, { error: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' });
        if (typeof body.username !== 'string' || body.username.length > 80 || typeof body.password !== 'string' || body.password.length > 256) return reply(400, { error: 'Usuario o contraseña no válidos' });
        const user = users.find(u => u.username === body.username.trim().toLowerCase());
        if (!verifyPassword(user, body.password)) { attempt.count++; attempts.set(address, attempt); return reply(401, { error: 'Usuario o contraseña incorrectos' }); }
        // Limitar el número de sesiones activas por usuario sin persistir tokens.
        const active = [...sessions].filter(([, s]) => s.userId === user.id);
        if (active.length >= 5) sessions.delete(active[0][0]);
        const token = randomBytes(32).toString('hex');
        const session = { userId: user.id, csrfToken: randomBytes(32).toString('hex'), expiresAt: now + sessionDuration };
        sessions.set(token, session);
        res.setHeader('Set-Cookie', `vecinoia_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
        return reply(200, { user: publicUser(user), csrfToken: session.csrfToken });
      }
      const token = cookieToken(req);
      const session = sessions.get(token);
      const user = session && users.find(u => u.id === session.userId);
      if (!user) return reply(401, { error: 'Identifícate para acceder a tu comunidad' });
      if (mutating && req.headers['x-csrf-token'] !== session.csrfToken) return reply(403, { error: 'Solicitud no autorizada. Recarga la página e inténtalo de nuevo.' });
      if (url.pathname === '/api/session' && req.method === 'GET') return reply(200, { user: publicUser(user), csrfToken: session.csrfToken });
      if (url.pathname === '/api/logout' && req.method === 'POST') {
        sessions.delete(token);
        res.setHeader('Set-Cookie', `vecinoia_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
        return reply(200, { ok: true });
      }
      if (url.pathname === '/api/communities' && req.method === 'GET') return reply(200, communities.filter(c => user.communityIds.includes(c.id)).map(({ id, name }) => ({ id, name })));
      if (url.pathname === '/api/service-requests' && req.method === 'GET') {
        if (!['resident', 'manager'].includes(user.role)) return reply(403, { error: 'Las consultas particulares se atienden exclusivamente desde Gestión VecinoIA' });
        return reply(200, store.serviceRequests.filter(item => user.communityIds.includes(item.communityId) && (user.role === 'manager' || item.residentId === user.id)).map(item => ({ ...item, communityName: communities.find(c => c.id === item.communityId)?.name || 'Comunidad' })));
      }
      const community = communities.find(item => item.id === url.searchParams.get('community'));
      if (!community) return reply(404, { error: 'Comunidad no encontrada' });
      if (!user.communityIds.includes(community.id)) return reply(403, { error: 'No tienes acceso a esta comunidad' });
      if (url.pathname === '/api/state' && req.method === 'GET') return reply(200, {
        ...community,
        assistant: assistant.status,
        advice: store.advice.filter(a => a.communityId === community.id && (user.role !== 'resident' || a.status === 'published')),
        documents: publishedDocs(community.id).map(documentView),
        faqs: undefined,
        ...(user.role !== 'resident' ? { managedDocuments: store.documents.filter(d => d.communityId === community.id).map(documentView) } : {}),
        announcements: [...store.announcements.filter(a => a.communityId === community.id), ...community.announcements],
        tickets: store.tickets.filter(ticket => ticket.communityId === community.id && (user.role !== 'resident' || ticket.residentId === user.id)),
        documentRequests: store.documentRequests.filter(item => item.communityId === community.id && (user.role !== 'resident' || item.residentId === user.id))
      });
      if (url.pathname.startsWith('/api/documents/') && url.pathname.endsWith('/download') && req.method === 'GET') {
        const doc = store.documents.find(d => d.communityId === community.id && d.id === url.pathname.split('/')[3] && (user.role !== 'resident' || (d.status === 'published' && d.processingStatus === 'ready')));
        if (!doc) return reply(404, { error: 'Documento no encontrado en esta comunidad' });
        if (doc.storageName) {
          const original = readFileSync(join(uploadsDir, doc.storageName));
          const mime = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain; charset=utf-8' }[doc.extension];
          res.writeHead(200, { 'Content-Type': mime, 'Content-Disposition': `attachment; filename="documento.${doc.extension}"; filename*=UTF-8''${encodeURIComponent(doc.originalFilename)}`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
          return res.end(original);
        }
        res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${doc.id}.pdf"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return res.end(documentPDF(community, doc));
      }
      if (!['POST', 'PATCH'].includes(req.method)) return reply(405, { error: 'Método no permitido' });
      const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
      if (url.pathname === '/api/documents/upload' && req.method === 'POST') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración y gestión pueden cargar documentos' });
        if (store.documents.filter(d => d.communityId === community.id && d.origin === 'upload').length >= 50) return reply(409, { error: 'Esta demo admite hasta 50 archivos por comunidad' });
        const contentType = req.headers['content-type'];
        if (!contentType?.startsWith('multipart/form-data;')) return reply(415, { error: 'Selecciona un archivo PDF, Word o TXT' });
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > maxFileSize + 65536) return reply(413, { error: 'Se admiten archivos de hasta 5 MB' }); chunks.push(chunk); }
        let form;
        try { form = await new Request(url, { method: 'POST', headers: { 'Content-Type': contentType }, body: Buffer.concat(chunks) }).formData(); }
        catch { return reply(400, { error: 'No se pudo leer el formulario de carga' }); }
        const file = form.get('file'), title = form.get('title');
        if (!validText(title, 120) || !file || typeof file.arrayBuffer !== 'function' || !file.size) return reply(400, { error: 'Indica un título y selecciona un archivo con contenido' });
        if (file.size > maxFileSize) return reply(413, { error: 'Se admiten archivos de hasta 5 MB' });
        const extension = file.name.split('.').pop().toLowerCase();
        if (!supportedExtensions.includes(extension)) return reply(415, { error: 'Solo se admiten PDF con texto, Word DOCX y TXT UTF-8' });
        const id = randomUUID(), storageName = `${id}.${extension}`, bytes = Buffer.from(await file.arrayBuffer());
        mkdirSync(uploadsDir, { recursive: true }); writeFileSync(join(uploadsDir, storageName), bytes, { flag: 'wx' });
        const createdAt = new Date().toISOString();
        const doc = { id, communityId: community.id, title: title.trim(), body: '', updated: createdAt.slice(0, 10), createdAt, status: 'draft', processingStatus: 'ready', origin: 'upload', uploadedBy: user.id, extension, originalFilename: file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 180), storageName, fileSize: bytes.length };
        try { doc.body = await extractDocument(bytes, extension); }
        catch (error) { doc.processingStatus = 'error'; doc.processingError = error.message; }
        store.documents.unshift(doc); save(); return reply(201, documentView(doc));
      }
      if (url.pathname.startsWith('/api/documents/') && req.method === 'PATCH') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración y gestión pueden publicar documentos' });
        const doc = store.documents.find(d => d.communityId === community.id && d.id === url.pathname.split('/').pop());
        if (!doc) return reply(404, { error: 'Documento no encontrado' });
        if (!['publish', 'withdraw'].includes(body.action)) return reply(400, { error: 'Acción no válida' });
        if (body.action === 'publish' && (doc.processingStatus !== 'ready' || !doc.body || body.reviewed !== true)) return reply(409, { error: 'Revisa el texto procesado y confirma su publicación. Los archivos con errores no se pueden publicar.' });
        doc.status = body.action === 'publish' ? 'published' : 'withdrawn'; doc.reviewedBy = user.id; doc.reviewedAt = new Date().toISOString();
        save(); return reply(200, documentView(doc));
      }
      if (url.pathname === '/api/service-requests' && req.method === 'POST') {
        if (user.role !== 'resident') return reply(403, { error: 'Las consultas particulares se crean desde el perfil de vecino' });
        if (!validText(body.subject, 120) || !validText(body.message, 2000) || !serviceCategories.includes(body.category)) return reply(400, { error: 'Revisa el asunto, el mensaje y la categoría del servicio' });
        const item = { id: randomUUID(), communityId: community.id, residentId: user.id, resident: user.name, category: body.category, subject: body.subject.trim(), message: body.message.trim(), status: 'Pendiente', reply: '', createdAt: new Date().toISOString() };
        store.serviceRequests.unshift(item); save(); return reply(201, item);
      }
      if (url.pathname.startsWith('/api/service-requests/') && req.method === 'PATCH') {
        if (user.role !== 'manager') return reply(403, { error: 'Solo Gestión VecinoIA puede responder consultas particulares' });
        const item = store.serviceRequests.find(r => r.id === url.pathname.split('/').pop() && r.communityId === community.id);
        if (!item) return reply(404, { error: 'Consulta particular no encontrada' });
        if (!statuses.includes(body.status) || typeof body.reply !== 'string' || body.reply.length > 2000) return reply(400, { error: 'Estado o respuesta no válidos' });
        item.status = body.status; item.reply = body.reply.trim(); item.updatedAt = new Date().toISOString(); save(); return reply(200, item);
      }
      if (url.pathname === '/api/document-requests' && req.method === 'POST') {
        const doc = publishedDocs(community.id).find(d => d.id === body.documentId);
        if (!doc) return reply(404, { error: 'Documento no encontrado en esta comunidad' });
        if (user.role !== 'resident') return reply(403, { error: 'Las solicitudes de documentos se crean desde un perfil de vecino' });
        const emailOK = typeof body.destination === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.destination) && body.destination.length <= 254;
        const phoneOK = typeof body.destination === 'string' && /^\+?[0-9]{8,15}$/.test(body.destination);
        if (!['email', 'whatsapp'].includes(body.channel) || (body.channel === 'email' ? !emailOK : !phoneOK)) return reply(400, { error: 'Indica un correo válido o un teléfono con prefijo internacional y entre 8 y 15 dígitos' });
        const item = { id: randomUUID(), communityId: community.id, documentId: doc.id, documentTitle: doc.title, residentId: user.id, resident: user.name, channel: body.channel, destination: body.destination, status: 'Pendiente', createdAt: new Date().toISOString() };
        store.documentRequests.unshift(item); save(); return reply(201, item);
      }
      if (url.pathname.startsWith('/api/document-requests/') && req.method === 'PATCH') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración puede actualizar solicitudes de documentos' });
        const item = store.documentRequests.find(r => r.id === url.pathname.split('/').pop() && r.communityId === community.id);
        if (!item) return reply(404, { error: 'Solicitud no encontrada' });
        if (!['Pendiente', 'Envío confirmado por gestor'].includes(body.status)) return reply(400, { error: 'Estado no válido' });
        if (body.status === 'Envío confirmado por gestor' && !publishedDocs(community.id).some(d => d.id === item.documentId)) return reply(409, { error: 'El documento está retirado. Publícalo antes de preparar un nuevo envío.' });
        item.status = body.status; item.confirmedAt = body.status === 'Pendiente' ? null : new Date().toISOString(); save(); return reply(200, item);
      }
      if (url.pathname === '/api/ask' && req.method === 'POST') {
        if (!validText(body.question, 1000)) return reply(400, { error: 'Escribe una pregunta de hasta 1.000 caracteres' });
        if (assistant.status.configured) {
          for (const [id, item] of assistantWindows) if (item.expiresAt <= now) assistantWindows.delete(id);
          if (assistantActive.has(user.id)) return reply(429, { error: 'Espera a que termine tu pregunta anterior' });
          const window = assistantWindows.get(user.id) || { count: 0, expiresAt: now + 10 * 60 * 1000 };
          if (window.count >= 20) return reply(429, { error: 'Has alcanzado el límite de preguntas de IA. Vuelve a intentarlo en unos minutos.' });
          if (assistantActive.size >= 3) return reply(429, { error: 'El asistente está atendiendo otras consultas. Inténtalo de nuevo en unos segundos.' });
          window.count++; assistantWindows.set(user.id, window);
        }
        const documents = publishedDocs(community.id).map(documentView);
        assistantActive.add(user.id);
        try {
          const currentCommunity = { ...community, documents, faqs: community.faqs.filter(f => documents.some(d => d.id === f.source)) };
          const answer = await assistant.answer(currentCommunity, body.question);
          const cited = answer.sources || (answer.source ? [answer.source] : []);
          const stillPublished = publishedDocs(community.id);
          if (cited.some(source => !stillPublished.some(doc => doc.id === source.id))) {
            return reply(200, { answer: 'Una de las fuentes se ha retirado mientras se preparaba la respuesta. Consulta de nuevo o envía la pregunta al administrador.', unresolved: true, source: null, sources: [], engine: 'document-search', aiStatus: 'source_withdrawn' });
          }
          return reply(200, answer);
        } finally { assistantActive.delete(user.id); }
      }
      if (url.pathname === '/api/tickets' && req.method === 'POST') {
        if (!validText(body.subject, 120) || !validText(body.message, 2000) || !categories.includes(body.category) || !['Normal', 'Alta'].includes(body.priority)) return reply(400, { error: 'Revisa el asunto, el mensaje, la categoría y la prioridad' });
        const ticket = { id: randomUUID(), communityId: community.id, subject: body.subject.trim(), message: body.message.trim(), category: body.category, priority: body.priority, status: 'Pendiente', reply: '', createdAt: new Date().toISOString(), residentId: user.id, resident: user.name };
        store.tickets.unshift(ticket); save(); return reply(201, ticket);
      }
      if (url.pathname.startsWith('/api/tickets/') && req.method === 'PATCH') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración puede responder consultas' });
        const ticket = store.tickets.find(t => t.id === url.pathname.split('/').pop() && t.communityId === community.id);
        if (!ticket) return reply(404, { error: 'Consulta no encontrada en esta comunidad' });
        if (!statuses.includes(body.status) || typeof body.reply !== 'string' || body.reply.length > 2000) return reply(400, { error: 'Estado o respuesta no válidos' });
        ticket.status = body.status; ticket.reply = body.reply.trim(); save(); return reply(200, ticket);
      }
      if (url.pathname === '/api/advice' && req.method === 'POST') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración y gestión pueden crear contenidos' });
        if (!validText(body.title, 120) || !validText(body.body, 4000) || !adviceKinds.includes(body.kind) || !adviceCategories.includes(body.category)) return reply(400, { error: 'Revisa el título, contenido, sección y categoría' });
        if (store.advice.filter(a => a.communityId === community.id).length >= 100) return reply(409, { error: 'Límite de 100 contenidos por comunidad' });
        const item = { id: randomUUID(), communityId: community.id, title: body.title.trim(), body: body.body.trim(), kind: body.kind, category: body.category, status: 'draft', updated: new Date().toISOString().slice(0, 10), demo: false };
        store.advice.unshift(item); save(); return reply(201, item);
      }
      if (url.pathname.startsWith('/api/advice/') && req.method === 'PATCH') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración y gestión pueden gestionar contenidos' });
        const item = store.advice.find(a => a.id === url.pathname.split('/').pop() && a.communityId === community.id);
        if (!item) return reply(404, { error: 'Contenido no encontrado en esta comunidad' });
        if (body.action === 'edit') {
          if (item.status === 'published') return reply(409, { error: 'Retira la publicación antes de editar el contenido' });
          if (!validText(body.title, 120) || !validText(body.body, 4000) || !adviceKinds.includes(body.kind) || !adviceCategories.includes(body.category)) return reply(400, { error: 'Revisa los datos del contenido' });
          Object.assign(item, { title: body.title.trim(), body: body.body.trim(), kind: body.kind, category: body.category, status: 'draft' });
        } else if (body.action === 'publish') {
          if (body.reviewed !== true) return reply(400, { error: 'Revisa y confirma el contenido antes de publicarlo' });
          item.status = 'published';
        } else if (body.action === 'withdraw') item.status = 'withdrawn';
        else return reply(400, { error: 'Acción no válida' });
        item.updated = new Date().toISOString().slice(0, 10); save(); return reply(200, item);
      }
      if (url.pathname === '/api/announcements' && req.method === 'POST') {
        if (!['admin', 'manager'].includes(user.role)) return reply(403, { error: 'Solo administración puede publicar avisos' });
        if (!validText(body.title, 120) || !validText(body.body, 2000)) return reply(400, { error: 'Escribe un título y un contenido válidos' });
        const announcement = { id: randomUUID(), communityId: community.id, title: body.title.trim(), body: body.body.trim(), category: 'Comunidad', date: new Date().toISOString().slice(0, 10) };
        store.announcements.unshift(announcement); save(); return reply(201, announcement);
      }
      return reply(404, { error: 'Ruta no encontrada' });
    } catch (error) {
      console.error('Error de aplicación:', error.message);
      if (!res.headersSent) reply(500, { error: 'No se pudo completar la operación' });
      else res.end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const envFile = join(root, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createApp();
  server.on('error', error => { console.error(`No se pudo iniciar VecinoIA: ${error.message}`); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`VecinoIA · http://${host}:${port} · Datos ficticios, acceso de demostración`));
}
