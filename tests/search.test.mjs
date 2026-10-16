import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupAnswer } from '../src/communities.mjs';

test('Las abreviaturas se reconocen también si aparecen en la fuente original', () => {
  const source = { id: 'gym-doc', title: 'Normas ficticias', body: 'El gym cierra a las 22:00.', status: 'published' };
  const community = { faqs: [], documents: [source] };
  for (const question of ['¿Cuándo cierra el gimnasio?', '¿Cuándo cierra el GYM?', '¿Cuándo cierra el gym?']) {
    const answer = lookupAnswer(community, question);
    assert.equal(answer.unresolved, false); assert.equal(answer.source.id, source.id);
    assert.match(answer.answer, /El gym cierra a las 22:00\./);
  }
});
