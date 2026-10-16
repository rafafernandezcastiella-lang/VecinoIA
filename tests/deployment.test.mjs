import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { createApp } from '../server.mjs';
import { createAssistant } from '../src/assistant.mjs';

test('Alojamiento: ruta persistente, healthcheck y cookies de producción', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'vecinoia-deploy-'));
  const originalDir = process.env.DATA_DIR, originalMode = process.env.NODE_ENV;
  let server;
  try {
    process.env.DATA_DIR = dir; process.env.NODE_ENV = 'production';
    const start = async () => {
      server = createApp({ assistant: createAssistant({ apiKey: '' }) });
      await new Promise(r => server.listen(0, '127.0.0.1', r));
      return `http://127.0.0.1:${server.address().port}`;
    };
    let base = await start();
    assert.deepEqual(await (await fetch(`${base}/healthz`)).json(), { ok: true });
    const login = async () => {
      const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'administrador', password: 'Admin-Demo-2026!' }) });
      assert.equal(r.status, 200); assert.match(r.headers.get('set-cookie'), /; Secure/);
      return { Cookie: r.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': (await r.json()).csrfToken, 'Content-Type': 'application/json' };
    };
    let headers = await login();
    const r = await fetch(`${base}/api/advice?community=olivos`, { method: 'POST', headers, body: JSON.stringify({ title: 'Persistencia de prueba', body: 'Ficha ficticia.', kind: 'Consejos', category: 'Gas' }) });
    assert.equal(r.status, 201); const item = await r.json();
    assert.ok(existsSync(join(dir, 'demo.json'))); assert.ok(existsSync(join(dir, 'users.json')));
    await new Promise(r => server.close(r)); base = await start(); headers = await login();
    const state = await (await fetch(`${base}/api/state?community=olivos`, { headers })).json();
    assert.ok(state.advice.some(a => a.id === item.id));
  } finally {
    if (server?.listening) await new Promise(r => server.close(r));
    if (originalDir === undefined) delete process.env.DATA_DIR; else process.env.DATA_DIR = originalDir;
    if (originalMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalMode;
    const rel = relative(resolve(tmpdir()), resolve(dir)); assert.ok(rel && !rel.startsWith('..'));
    rmSync(dir, { recursive: true, force: true });
  }
});
