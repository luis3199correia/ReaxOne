import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const FONT_SIZE = 7;
const BOTTOM_MARGIN = 10;
const SIDE_MARGIN = 10;
const TEXT_GREY = rgb(0.55, 0.55, 0.55);

/**
 * Escreve `text` centrado no rodapé de todas as páginas.
 * Lança erro em PDFs inválidos ou cifrados — quem chama decide se envia o original.
 */
export async function watermarkPdf(pdf: Uint8Array, text: string): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const textWidth = font.widthOfTextAtSize(text, FONT_SIZE);

  for (const page of doc.getPages()) {
    const { x, y, width } = page.getCropBox();
    page.drawText(text, {
      x: x + Math.max((width - textWidth) / 2, SIDE_MARGIN),
      y: y + BOTTOM_MARGIN,
      size: FONT_SIZE,
      font,
      color: TEXT_GREY,
    });
  }
  return Buffer.from(await doc.save());
}
