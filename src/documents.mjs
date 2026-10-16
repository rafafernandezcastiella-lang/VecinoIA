import { Worker } from 'node:worker_threads';

export const maxFileSize = 5 * 1024 * 1024;
export const supportedExtensions = ['pdf', 'docx', 'txt'];
export const documentView = ({ storageName, uploadedBy, ...doc }) => doc;
export function extractDocument(bytes, extension) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./document-worker.mjs', import.meta.url), { workerData: { bytes: new Uint8Array(bytes), extension }, resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 } });
    let settled = false;
    const finish = (error, text) => { if (settled) return; settled = true; clearTimeout(timer); void worker.terminate(); if (error) reject(new Error(error)); else resolve(text); };
    const timer = setTimeout(() => finish('El procesamiento ha superado los 20 segundos. Prueba con un documento más pequeño.'), 20000);
    worker.once('message', result => finish(result.error, result.text));
    worker.once('error', () => finish('No se pudo procesar el archivo. Revisa el formato o prueba con TXT.'));
    worker.once('exit', () => { if (!settled) finish('El procesamiento se interrumpió. Prueba con un documento más pequeño.'); });
  });
}
