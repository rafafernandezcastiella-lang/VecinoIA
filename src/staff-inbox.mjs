export const readKey = (userId, kind, id) => `${userId}:${kind}:${id}`;
export function staffInbox(store, user, communities) {
  const sources = [['ticket', store.tickets], ['document', store.documentRequests], ...(user.role === 'manager' ? [['service', store.serviceRequests]] : [])];
  const items = sources.flatMap(([kind, records]) => records.filter(r => user.communityIds.includes(r.communityId)).map(r => ({
    kind, id: r.id, communityId: r.communityId, communityName: communities.find(c => c.id === r.communityId)?.name || '',
    subject: r.subject || `Solicitud: ${r.documentTitle}`, resident: r.resident, createdAt: r.createdAt,
    read: store.staffReads.includes(readKey(user.id, kind, r.id))
  }))).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return { items, unreadCount: items.filter(i => !i.read).length, simulatedEmailCount: store.staffEmailNotifications.filter(n => n.recipientIds.includes(user.id)).length };
}
export function simulateStaffEmail(store, users, kind, item) {
  const recipientIds = users.filter(u => u.communityIds.includes(item.communityId) && (kind === 'service' ? u.role === 'manager' : ['admin','manager'].includes(u.role))).map(u => u.id);
  store.staffEmailNotifications.push({ kind, messageId: item.id, communityId: item.communityId, recipientIds, mode: 'simulation', sentCount: 0, createdAt: new Date().toISOString() });
}
export function validateResidentContact(body, users, communityId, directory, currentId) {
  const valid = (v,max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  if (!valid(body.firstName,60) || !valid(body.lastName,100) || !valid(body.floor,20) || !valid(body.unit,20) || typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || typeof body.phone !== 'string' || !/^[+0-9 ()-]{7,25}$/.test(body.phone) || !/^[0-9]{7,15}$/.test(body.phone.replace(/\D/g,''))) return {error:'Completa piso, letra, nombre, apellidos, un correo válido y teléfono'};
  const userId = body.userId || null;
  if (userId && !users.some(u => u.id === userId && u.role === 'resident' && u.communityIds.includes(communityId))) return {error:'La cuenta debe ser de un vecino de esta comunidad'};
  if (userId && directory.some(r => r.communityId === communityId && r.userId === userId && r.id !== currentId)) return {error:'Esa cuenta ya tiene un contacto en esta comunidad'};
  return {value:{firstName:body.firstName.trim(),lastName:body.lastName.trim(),floor:body.floor.trim(),unit:body.unit.trim(),email:body.email.trim(),phone:body.phone.trim(),userId}};
}
