// Contenido ilustrativo: no representa convocatorias ni ofertas vigentes.
export const adviceKinds = ['Consejos', 'Ayudas', 'Servicios'];
export const adviceCategories = ['Luz', 'Gas', 'Seguros', 'Mantenimiento', 'Otras consultas'];
export function seedAdvice(communities) {
  const examples = [
    ['Consejos', 'Luz', 'Entiende tu contrato de luz', 'Ejemplo para el concurso: un espacio donde solicitar una revisión particular de tu contrato, plantear dudas y recibir orientación de Gestión VecinoIA.'],
    ['Consejos', 'Gas', 'Un espacio también para tus dudas de gas', 'Ejemplo para viviendas con agua caliente o calefacción individual: plantea tu consulta sobre el suministro de gas a Gestión VecinoIA desde el canal privado.'],
    ['Ayudas', 'Otras consultas', 'Ayudas para mejorar el edificio', 'Ejemplo de ficha para futuras convocatorias de rehabilitación, accesibilidad o eficiencia energética. Esta ficha no anuncia una ayuda vigente ni acredita requisitos o plazos. Solicita información para tu caso.'],
    ['Servicios', 'Mantenimiento', 'Atención técnica para tu vivienda', 'Ejemplo de servicio para trasladar una necesidad particular de mantenimiento a Gestión VecinoIA. Si la incidencia afecta a una zona común, utiliza Consultas comunidad.']
  ];
  return communities.flatMap(c => examples.map(([kind, category, title, body], i) => ({ id: `advice-${c.id}-${i}`, communityId: c.id, kind, category, title, body, status: 'published', updated: '2026-10-16', demo: true })));
}
