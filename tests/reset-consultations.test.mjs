import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { resetConsultationsOnce } from '../src/reset-consultations.mjs';

test('La limpieza conserva otras colecciones y backup y no borra futuras consultas al reiniciar', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vecinoia-reset-'));
  try {
    const file = join(dir, 'demo.json');
    const original = { tickets: [{ id: 'comunitaria' }], serviceRequests: [{ id: 'particular' }], documents: [{ id: 'gimnasio' }], advice: [{ id: 'gas' }], announcements: [{ id: 'aviso' }], documentRequests: [{ id: 'envio' }] };
    original.neighborMessages = [{ id: 'aviso-personal', readAt: null }];
    original.residentDirectory = [{ id: 'contacto' }];
    original.staffReads = ['admin:ticket:comunitaria', 'gestor:service:particular', 'admin:document:envio'];
    original.staffEmailNotifications = [{kind:'ticket'}, {kind:'service'}, {kind:'document'}];
    writeFileSync(file, JSON.stringify(original));
    assert.deepEqual(resetConsultationsOnce(file), { applied: true, communityQueries: 1, privateQueries: 1 });
    const store = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(store.tickets, []); assert.deepEqual(store.serviceRequests, []);
    for (const key of ['documents', 'advice', 'announcements', 'documentRequests']) assert.deepEqual(store[key], original[key]);
    for (const key of ['neighborMessages','residentDirectory']) assert.deepEqual(store[key], original[key]);
    assert.deepEqual(store.staffReads, ['admin:document:envio']);
    assert.deepEqual(store.staffEmailNotifications, [{kind:'document'}]);
    const backup = join(dir, 'backups', 'reset-consultations-video-2026-10-16.json');
    assert.deepEqual(JSON.parse(readFileSync(backup, 'utf8')), original);
    store.tickets.push({ id: 'nueva' }); store.serviceRequests.push({ id: 'nueva-privada' });
    writeFileSync(file, JSON.stringify(store));
    assert.deepEqual(resetConsultationsOnce(file), { applied: false });
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), store);
    assert.deepEqual(JSON.parse(readFileSync(backup, 'utf8')), original);
  } finally {
    const rel = relative(resolve(tmpdir()), resolve(dir)); assert.ok(rel && !rel.startsWith('..'));
    rmSync(dir, { recursive: true, force: true });
  }
});
