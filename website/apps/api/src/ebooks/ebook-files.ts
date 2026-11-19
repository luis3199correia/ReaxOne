/**
 * Ebooks pagos: que PDFs (chaves no bucket R2 privado) seguem em anexo para uma encomenda.
 * Funções puras — o acesso ao R2 e o envio do email estão no EbooksService.
 */

export const EBOOK_KEY_MAX_LENGTH = 300;

// Chave relativa no bucket, terminada em .pdf (sem "/" inicial, "//" nem "..")
const EBOOK_KEY_RE = /^[A-Za-z0-9][A-Za-z0-9._ \-/]*\.pdf$/i;

export function isValidEbookKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.length <= EBOOK_KEY_MAX_LENGTH &&
    EBOOK_KEY_RE.test(key) &&
    !key.includes('//') &&
    !key.split('/').includes('..')
  );
}

interface EbookOrderItem {
  productId: string;
  product: {
    name: string;
    slug: string;
    ebookFile?: string | null;
    ebookFileEn?: string | null;
  } | null;
}

export interface EbookFile {
  productId: string;
  title: string;
  key: string;
  filename: string;
}

/** Um anexo por idioma disponível, cada produto uma só vez. */
export function ebookFilesForOrder(items: EbookOrderItem[]): EbookFile[] {
  const seen = new Set<string>();
  const files: EbookFile[] = [];

  for (const item of items) {
    const product = item.product;
    if (!product || seen.has(item.productId)) continue;
    seen.add(item.productId);

    const pt = product.ebookFile && isValidEbookKey(product.ebookFile) ? product.ebookFile : null;
    const en = product.ebookFileEn && isValidEbookKey(product.ebookFileEn) ? product.ebookFileEn : null;
    const bothLanguages = !!pt && !!en;

    if (pt) {
      files.push({ productId: item.productId, title: product.name, key: pt, filename: `${product.slug}${bothLanguages ? '-pt' : ''}.pdf` });
    }
    if (en) {
      files.push({ productId: item.productId, title: product.name, key: en, filename: `${product.slug}${bothLanguages ? '-en' : ''}.pdf` });
    }
  }
  return files;
}

/** Texto do rodapé. A fonte standard do PDF (WinAnsi) só desenha ASCII com segurança. */
export function watermarkText(email: string, orderId: string): string {
  const reference = orderId.slice(-8).toUpperCase();
  const text = `Licenciado a ${email} - Encomenda #${reference}`;
  return text.replace(/[^\x20-\x7E]/g, '?');
}
