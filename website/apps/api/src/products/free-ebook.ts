export const EBOOKS_CATEGORY_SLUG = 'ebooks';

interface EbookFields {
  ebookFile?: string | null;
  ebookFileEn?: string | null;
  category?: { slug?: string | null } | null;
}

interface EbookLike extends EbookFields {
  price: number;
}

/** Ebook (tem ficheiro PT/EN ou está na categoria Ebooks). */
export function isEbookProduct(product: EbookFields): boolean {
  return !!product.ebookFile || !!product.ebookFileEn || product.category?.slug === EBOOKS_CATEGORY_SLUG;
}

/**
 * Ebook gratuito: descarrega-se pelo link público da página do produto,
 * por isso não pode entrar no carrinho nem numa encomenda.
 */
export function isFreeEbook(product: EbookLike): boolean {
  return isEbookProduct(product) && Number(product.price) === 0;
}
