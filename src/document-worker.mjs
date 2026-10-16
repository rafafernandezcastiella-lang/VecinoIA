import { parentPort, workerData } from 'node:worker_threads';

const maxText = 200000;
function validateDocxZip(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 > buffer.length) throw new Error('El archivo Word no tiene una estructura válida');
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16), total = 0;
  if (count > 1000 || offset >= end) throw new Error('El documento Word supera los límites de procesamiento');
  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('El archivo Word está dañado');
    if (buffer.readUInt16LE(offset + 8) & 1) throw new Error('No se admiten archivos Word cifrados');
    total += buffer.readUInt32LE(offset + 24);
    if (total > 25 * 1024 * 1024) throw new Error('El documento Word es demasiado grande al descomprimirlo');
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}
try {
  const buffer = Buffer.from(workerData.bytes);
  let text = '';
  if (workerData.extension === 'txt') {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } else if (workerData.extension === 'docx') {
    validateDocxZip(buffer);
    const { default: mammoth } = await import('mammoth');
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    if (!buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw new Error('El archivo no es un PDF válido');
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: false, disableFontFace: true, useWorkerFetch: false, verbosity: 0 });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 100) throw new Error('Se admiten PDF de hasta 100 páginas');
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i), content = await page.getTextContent();
        text += content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('') + '\n';
        if (text.length > maxText) throw new Error('El texto extraído supera los 200.000 caracteres');
      }
    } finally { await task.destroy(); }
  }
  text = text.replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
  if (text.length < 10) throw new Error('No se ha encontrado texto suficiente. Si es un escaneo, necesita reconocimiento de texto (OCR) antes de subirlo.');
  if (text.length > maxText) throw new Error('El texto extraído supera los 200.000 caracteres');
  parentPort.postMessage({ text });
} catch (error) {
  const message = error.name === 'PasswordException' ? 'El PDF está protegido con contraseña. Sube una copia sin contraseña.' : error.message;
  parentPort.postMessage({ error: message || 'No se ha podido extraer el texto del archivo' });
}
