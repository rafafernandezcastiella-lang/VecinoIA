// PDF sencillo para los documentos ficticios del portal, sin dependencias.
const latin = value => String(value).replace(/€/g, 'EUR').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\xff\n]/g, '?');
const literal = value => latin(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
function wrap(text) {
  return latin(text).split('\n').flatMap(paragraph => {
    const lines = []; let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (line.length + word.length + 1 > 72) { lines.push(line); line = ''; }
      line += (line ? ' ' : '') + word;
    }
    lines.push(line); return lines;
  });
}
export function documentPDF(community, doc) {
  const lines = [
    ...wrap(`VecinoIA - ${community.name}`), '', ...wrap(doc.title),
    `Actualizado: ${doc.updated}`, 'Documento ficticio de demostracion', '', ...wrap(doc.body)
  ];
  const chunks = [];
  for (let i = 0; i < lines.length; i += 45) chunks.push(lines.slice(i, i + 45));
  const objects = [null, '<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'];
  const pageIds = [];
  for (const chunk of chunks) {
    const pageId = objects.length, streamId = pageId + 1; pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);
    const stream = `BT /F1 11 Tf 16 TL 50 790 Td\n${chunk.map((line, i) => `${i ? 'T* ' : ''}(${literal(line)}) Tj`).join('\n')}\nET`;
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  }
  objects[2] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`;
  let output = '%PDF-1.4\n', offsets = [0];
  for (let i = 1; i < objects.length; i++) { offsets.push(Buffer.byteLength(output, 'latin1')); output += `${i} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(output, 'latin1');
}
