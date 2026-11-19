import { PDFDocument } from 'pdf-lib';
import { watermarkPdf } from './watermark';

async function samplePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]);
  return doc.save();
}

describe('watermarkPdf', () => {
  it('keeps every page and returns a valid PDF', async () => {
    const original = await samplePdf(3);

    const stamped = await watermarkPdf(original, 'Licenciado a ana@example.com - Encomenda #ABC');

    const reloaded = await PDFDocument.load(stamped);
    expect(reloaded.getPageCount()).toBe(3);
    expect(stamped.length).toBeGreaterThan(original.length);
  });

  it('rejects a file that is not a PDF', async () => {
    await expect(watermarkPdf(Buffer.from('not a pdf'), 'x')).rejects.toThrow();
  });
});
