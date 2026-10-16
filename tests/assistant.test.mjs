import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssistant, selectContext } from '../src/assistant.mjs';

const doc = { id: 'olivos-gym', title: 'Normas del gimnasio', body: 'El gimnasio abre a las 07:00 y cierra a las 22:00.', status: 'published', processingStatus: 'ready', updated: '2026-10-14' };
const community = { id: 'olivos', name: 'Los Olivos', documents: [doc], faqs: [] };
const modelResult = { sufficient: true, answer: 'Puedes entrenar hasta las 22:00.', citations: [{ document_id: doc.id, quote: 'cierra a las 22:00.' }] };
const response = result => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(result) }] }] }) });

test('Sin clave no se llama a ningún proveedor y se conserva la búsqueda local', async () => {
  const ai = createAssistant({ apiKey: '', fetchImpl: () => { throw new Error('No debe llamarse'); } });
  assert.equal(ai.status.configured, false);
  const answer = await ai.answer(community, '¿Cuándo cierra el gym?');
  assert.equal(answer.aiStatus, 'not_configured'); assert.equal(answer.unresolved, false); assert.equal(answer.source.id, doc.id);
});

test('Contrato Responses: contexto acotado, salida estructurada y fuente literal validada', async () => {
  let sent;
  const ai = createAssistant({ apiKey: 'clave-ficticia-de-test', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    sent = JSON.parse(options.body);
    assert.equal(options.headers.Authorization, 'Bearer clave-ficticia-de-test');
    return response(modelResult);
  } });
  const answer = await ai.answer(community, '¿Hasta qué hora puedo entrenar?');
  assert.equal(answer.engine, 'openai'); assert.equal(answer.aiStatus, 'answered'); assert.equal(answer.unresolved, false);
  assert.equal(answer.sources[0].body, modelResult.citations[0].quote);
  assert.equal(sent.store, false); assert.equal(sent.text.format.type, 'json_schema'); assert.equal(sent.text.format.strict, true);
  assert.equal(sent.tools, undefined);
  const context = JSON.parse(sent.input[0].content[0].text);
  assert.deepEqual(context.sources.map(s => s.document_id), [doc.id]);
  assert.ok(!JSON.stringify(context).includes('clave-ficticia-de-test'));
});

test('Se rechazan respuestas sin fuente, con fuente ajena o con una cita inventada', async () => {
  for (const citations of [[], [{ document_id: 'otra-comunidad', quote: modelResult.citations[0].quote }], [{ document_id: doc.id, quote: 'El gimnasio cierra a medianoche.' }]]) {
    const ai = createAssistant({ apiKey: 'ficticia', fetchImpl: async () => response({ ...modelResult, citations }) });
    const answer = await ai.answer(community, '¿Cuándo cierra el gimnasio?');
    assert.equal(answer.unresolved, true); assert.equal(answer.source, null); assert.notEqual(answer.answer, modelResult.answer);
  }
});

test('Contexto insuficiente no muestra texto sin soporte y un fallo de proveedor se distingue', async () => {
  const insufficient = createAssistant({ apiKey: 'ficticia', fetchImpl: async () => response({ sufficient: false, answer: 'Dato no respaldado', citations: [] }) });
  assert.equal((await insufficient.answer(community, '¿Hay una derrama?')).unresolved, true);
  assert.ok(!(await insufficient.answer(community, '¿Hay una derrama?')).answer.includes('Dato no respaldado'));
  for (const provider of [async () => ({ ok: false }), async () => { throw new Error('Token secreto que no debe salir'); }, async () => ({ ok: true, json: async () => ({ status: 'incomplete' }) })]) {
    const ai = createAssistant({ apiKey: 'ficticia', fetchImpl: provider });
    const answer = await ai.answer(community, '¿Cuándo cierra el gym?');
    assert.equal(answer.aiStatus, 'unavailable'); assert.notEqual(answer.engine, 'openai'); assert.ok(answer.notice); assert.ok(!JSON.stringify(answer).includes('Token secreto'));
  }
});

test('El contexto excluye borradores y errores y limita el texto enviado', () => {
  const hidden = [{ ...doc, id: 'draft', status: 'draft' }, { ...doc, id: 'withdrawn', status: 'withdrawn' }, { ...doc, id: 'error', processingStatus: 'error' }];
  assert.deepEqual(selectContext([doc, ...hidden], 'gym').map(d => d.document_id), [doc.id]);
  const large = Array.from({ length: 6 }, (_, i) => ({ ...doc, id: `doc-${i}`, body: `${doc.body} `.repeat(3000) }));
  const selected = selectContext(large, 'gimnasio');
  assert.ok(selected.length <= 20); assert.ok(selected.reduce((n, d) => n + d.excerpt.length, 0) <= 32000);
});
