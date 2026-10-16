import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Credenciales públicas y ficticias exclusivamente para la demostración.
export const demoAccounts = [
  { id: 'neighbor-olivos', username: 'vecino.olivos', password: 'Olivos-Demo-2026!', name: 'Ana · Vecina ficticia', role: 'resident', communityIds: ['olivos'] },
  { id: 'neighbor-olivos-2', username: 'vecino.olivos2', password: 'Olivos2-Demo-2026!', name: 'Luis · Vecino ficticio', role: 'resident', communityIds: ['olivos'] },
  { id: 'neighbor-plaza', username: 'vecino.plaza', password: 'Plaza-Demo-2026!', name: 'Marta · Vecina ficticia', role: 'resident', communityIds: ['plaza'] },
  { id: 'admin-demo', username: 'administrador', password: 'Admin-Demo-2026!', name: 'Administrador ficticio', role: 'admin', communityIds: ['olivos', 'plaza'] },
  { id: 'admin-olivos', username: 'admin.olivos', password: 'AdminOlivos-Demo-2026!', name: 'Administrador de Los Olivos', role: 'admin', communityIds: ['olivos'] },
  { id: 'management-demo', username: 'gestion', password: 'Gestion-Demo-2026!', name: 'Gestión VecinoIA', role: 'manager', communityIds: ['olivos', 'plaza'] }
];

export function loadUsers(file) {
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const users = demoAccounts.map(({ password, ...account }) => {
    const salt = randomBytes(16).toString('hex');
    return { ...account, salt, passwordHash: scryptSync(password, salt, 64).toString('hex') };
  });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(users, null, 2), { flag: 'wx' });
  return users;
}

export function verifyPassword(user, password) {
  const hash = scryptSync(password, user?.salt || 'vecinoia-dummy-salt', 64);
  const expected = user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64);
  return timingSafeEqual(hash, expected) && Boolean(user);
}

export const publicUser = ({ id, username, name, role, communityIds }) => ({ id, username, name, role, communityIds });
export function cookieToken(req) {
  return (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('vecinoia_session='))?.slice('vecinoia_session='.length);
}
