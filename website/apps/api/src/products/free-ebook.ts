export const EBOOKS_CATEGORY_SLUG = 'ebooks';

interface EbookLike {
  price: number;
  ebookFile?: string | null;
  category?: { slug?: string | null } | null;
}

/** Ebook (tem ficheiro ou está na categoria Ebooks). */
export function isEbookProduct(product: EbookLike): boolean {
  return !!product.ebookFile || product.category?.slug === EBOOKS_CATEGORY_SLUG;
}

/**
 * Ebook gratuito: descarrega-se pelo link público da página do produto,
 * por isso não pode entrar no carrinho nem numa encomenda.
 */
export function isFreeEbook(product: EbookLike): boolean {
  return isEbookProduct(product) && Number(product.price) === 0;
}
