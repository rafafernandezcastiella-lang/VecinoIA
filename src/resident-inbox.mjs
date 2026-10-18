import { randomUUID } from 'node:crypto';

export const simulatedEmail = () => ({ mode: 'simulation', sentCount: 0, createdAt: new Date().toISOString() });

// A status-only save does not notify again; each changed answer has its own receipt.
export function notifyReply(item, reply) {
  if (reply && reply !== item.reply) item.replyNotification = { id: randomUUID(), readAt: null, createdAt: new Date().toISOString(), email: simulatedEmail() };
}

export function residentInbox(store, user, communities) {
  const sources = [['ticket', store.tickets], ['service', store.serviceRequests], ['neighbor', store.neighborMessages]];
  const items = sources.flatMap(([kind, records]) => records.filter(r => user.communityIds.includes(r.communityId) && (kind === 'neighbor' ? r.recipientId === user.id : r.residentId === user.id && r.reply)).map(r => {
    const notification = kind === 'neighbor' ? r : r.replyNotification;
    return { kind, id: r.id, notificationId: notification?.id || r.id, communityId: r.communityId,
      communityName: communities.find(c => c.id === r.communityId)?.name || '', subject: r.subject,
      sender: kind === 'neighbor' ? r.sender : kind === 'service' ? 'Gestión VecinoIA' : 'Administración',
      createdAt: notification?.createdAt || r.updatedAt || r.createdAt, read: !!notification?.readAt,
      email: kind === 'neighbor' ? r.emailNotification || null : notification?.email || null };
  })).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return { items, unreadCount: items.filter(i => !i.read).length, simulatedEmailCount: items.filter(i => i.email?.mode === 'simulation').length };
}

export function markResidentRead(store, item) {
  const record = (item.kind === 'ticket' ? store.tickets : item.kind === 'service' ? store.serviceRequests : store.neighborMessages).find(r => r.id === item.id);
  if (item.kind === 'neighbor') record.readAt ||= new Date().toISOString();
  else {
    record.replyNotification ||= { id: record.id, createdAt: item.createdAt };
    record.replyNotification.readAt ||= new Date().toISOString();
  }
}
