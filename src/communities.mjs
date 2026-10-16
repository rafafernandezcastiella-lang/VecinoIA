// Todos los nombres, contenidos e importes son ficticios.
export const communities = [
  {
    id: 'olivos', name: 'Residencial Los Olivos', initials: 'LO',
    subtitle: 'Un lugar para vivir, una comunidad para cuidar.', color: '#0072CE',
    backgroundImage: '/images/los-olivos.png', backgroundPosition: 'center center',
    homes: 48, address: 'Calle del Jardín, 12 · Dirección ficticia',
    meeting: { date: '2026-10-28', time: '18:30', place: 'Sala comunitaria', title: 'Junta ordinaria de otoño' },
    announcements: [
      { id: 'olivos-a1', title: 'Revisión del ascensor', category: 'Mantenimiento', date: '2026-10-13', body: 'El 20 de octubre, de 10:00 a 12:00, se revisará el ascensor del portal A. Durante ese horario estará fuera de servicio.' },
      { id: 'olivos-a2', title: 'Nos vemos en la próxima junta', category: 'Comunidad', date: '2026-10-12', body: 'Revisaremos el presupuesto del jardín y las propuestas para mejorar la iluminación. La reunión será el 28 de octubre a las 18:30 en la sala comunitaria.' }
    ],
    documents: [
      { id: 'olivos-normas', title: 'Normas de zonas comunes', updated: '2026-10-10', body: 'La piscina abre de 10:00 a 21:00 durante la temporada de verano. La sala comunitaria puede utilizarse de 09:00 a 22:00, previa solicitud al administrador. El horario de descanso es de 22:00 a 08:00. Cada vivienda puede reservar la sala una vez por semana.' },
      { id: 'olivos-junta', title: 'Convocatoria de junta de octubre', updated: '2026-10-12', body: 'La junta ordinaria se celebrará el 28 de octubre de 2026 a las 18:30 en la sala comunitaria. Orden del día: presupuesto del jardín, iluminación de zonas comunes y propuestas de vecinos.' },
      { id: 'olivos-cuotas', title: 'Información de cuotas', updated: '2026-10-10', body: 'La cuota ordinaria de la comunidad es de 85 euros mensuales y se gira el día 5 de cada mes. Las dudas sobre recibos particulares se trasladan al administrador. Este portal no contiene saldos personales.' }
    ],
    faqs: [
      { keywords: ['piscina', 'baño', 'nadar'], answer: 'La piscina abre de 10:00 a 21:00 durante la temporada de verano.', source: 'olivos-normas' },
      { keywords: ['sala', 'reserva', 'reservar'], answer: 'La sala comunitaria se utiliza de 09:00 a 22:00. Debes solicitarla al administrador y cada vivienda puede reservar una vez por semana.', source: 'olivos-normas' },
      { keywords: ['junta', 'reunión', 'reunion', 'asamblea'], answer: 'La próxima junta será el 28 de octubre de 2026 a las 18:30, en la sala comunitaria.', source: 'olivos-junta' },
      { keywords: ['cuota', 'cuotas', 'recibo', 'pago'], answer: 'La cuota ordinaria es de 85 € mensuales y se gira el día 5. Para revisar un recibo particular, envía una consulta al administrador.', source: 'olivos-cuotas' }
    ]
  },
  {
    id: 'plaza', name: 'Comunidad Plaza Mayor', initials: 'PM',
    subtitle: 'Toda la información de tu edificio, más cerca.', color: '#0072CE',
    backgroundImage: '/images/plaza-mayor.png', backgroundPosition: 'center center',
    homes: 24, address: 'Plaza del Encuentro, 8 · Dirección ficticia',
    meeting: { date: '2026-10-30', time: '19:00', place: 'Vestíbulo principal', title: 'Junta extraordinaria' },
    announcements: [
      { id: 'plaza-a1', title: 'Nueva iluminación del portal', category: 'Mejora', date: '2026-10-13', body: 'El 22 de octubre se sustituirán las luminarias por equipos LED. Los trabajos se realizarán entre las 09:00 y las 13:00.' },
      { id: 'plaza-a2', title: 'Propuestas para la terraza', category: 'Comunidad', date: '2026-10-11', body: 'Puedes enviar tus propuestas sobre el uso de la terraza antes de la junta del 30 de octubre.' }
    ],
    documents: [
      { id: 'plaza-normas', title: 'Normas de terraza y descanso', updated: '2026-10-10', body: 'La terraza comunitaria abre de 09:00 a 20:00. No se permiten barbacoas. El horario de descanso es de 22:00 a 09:00. Esta comunidad no dispone de piscina ni sala comunitaria.' },
      { id: 'plaza-junta', title: 'Convocatoria de junta extraordinaria', updated: '2026-10-11', body: 'La junta extraordinaria será el 30 de octubre de 2026 a las 19:00, en el vestíbulo principal. Se tratarán la iluminación del portal y el uso de la terraza.' },
      { id: 'plaza-cuotas', title: 'Información de cuotas', updated: '2026-10-10', body: 'La cuota ordinaria es de 62 euros mensuales y se gira el día 10. Las consultas sobre recibos individuales deben remitirse al administrador.' }
    ],
    faqs: [
      { keywords: ['terraza', 'barbacoa'], answer: 'La terraza abre de 09:00 a 20:00. No se permiten barbacoas.', source: 'plaza-normas' },
      { keywords: ['piscina', 'sala'], answer: 'Plaza Mayor no dispone de piscina ni sala comunitaria.', source: 'plaza-normas' },
      { keywords: ['junta', 'reunión', 'reunion', 'asamblea'], answer: 'La junta extraordinaria será el 30 de octubre de 2026 a las 19:00, en el vestíbulo principal.', source: 'plaza-junta' },
      { keywords: ['cuota', 'cuotas', 'recibo', 'pago'], answer: 'La cuota ordinaria es de 62 € mensuales y se gira el día 10. Puedes trasladar las dudas sobre tu recibo al administrador.', source: 'plaza-cuotas' }
    ]
  }
];

const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const aliases = new Map([['gym', 'gimnasio'], ['gyms', 'gimnasio'], ['gimnasios', 'gimnasio']]);
const searchTokens = text => (normalize(text).match(/[a-z]+/g) || []).map(word => aliases.get(word) || word);
export function lookupAnswer(community, question) {
  // Primera fase: coincidencia de términos, sin modelo generativo.
  const words = new Set(searchTokens(question));
  const matches = community.faqs.filter(faq => faq.keywords.some(word => words.has(normalize(word))));
  if (matches.length > 1) return {
    answer: 'No encuentro una respuesta única en las preguntas frecuentes de esta comunidad. Puedes enviar la pregunta al administrador.',
    source: null, unresolved: true, engine: 'faq'
  };
  if (!matches.length) {
    const stop = new Set(['que', 'cual', 'cuales', 'como', 'cuando', 'donde', 'puedo', 'puede', 'para', 'por', 'del', 'las', 'los', 'una', 'unos', 'con', 'esta', 'este', 'hay', 'son', 'quiero', 'saber', 'favor', 'necesito']);
    const terms = [...words].filter(w => w.length > 2 && !stop.has(w));
    const candidates = community.documents.flatMap(doc => doc.body.split(/(?<=[.!?])\s+|\n+/).map(text => {
      const textWords = new Set(searchTokens(text));
      return { doc, text, score: terms.filter(term => textWords.has(term)).length };
    })).filter(item => terms.length && item.score >= Math.min(2, terms.length) && item.text.length < 1800).sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (best && !candidates.slice(1).some(c => c.score === best.score && c.doc.id !== best.doc.id)) return { answer: `Según «${best.doc.title}»:\n${best.text.trim()}`, source: best.doc, unresolved: false, engine: 'document-search' };
    return { answer: 'No encuentro información suficiente en las fuentes publicadas de tu comunidad. Puedes enviar la pregunta al administrador.', source: null, unresolved: true, engine: 'document-search' };
  }
  const match = matches[0];
  return { answer: match.answer, source: community.documents.find(doc => doc.id === match.source), unresolved: false, engine: 'faq' };
}
