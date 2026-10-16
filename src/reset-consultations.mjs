import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Operación puntual autorizada por el usuario para limpiar los ensayos del vídeo.
export function resetConsultationsOnce(dataFile) {
  const operation = 'reset-consultations-video-2026-10-16';
  if (!existsSync(dataFile)) return { applied: false };
  const store = JSON.parse(readFileSync(dataFile, 'utf8'));
  if (store.maintenance?.includes(operation)) return { applied: false };
  const backupDir = join(dirname(dataFile), 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `${operation}.json`);
  if (!existsSync(backupFile)) writeFileSync(backupFile, JSON.stringify(store, null, 2), { flag: 'wx' });
  const result = { applied: true, communityQueries: (store.tickets || []).length, privateQueries: (store.serviceRequests || []).length };
  store.tickets = []; store.serviceRequests = [];
  store.maintenance = [...(store.maintenance || []), operation];
  writeFileSync(`${dataFile}.tmp`, JSON.stringify(store, null, 2));
  renameSync(`${dataFile}.tmp`, dataFile);
  return result;
}
