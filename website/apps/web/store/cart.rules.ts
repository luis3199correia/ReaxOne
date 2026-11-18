/**
 * Regras do carrinho, sem React/zustand.
 *
 * No browser guarda-se só o que o cliente escolheu (produto, tamanho, quantidade).
 * Nome, preço e imagem vêm sempre do catálogo da API, para não haver preços
 * antigos ou alterados à mão no localStorage.
 */

export interface CartItem {
  id: string;
  /** Slug do catálogo (= g:id do Google Merchant Center); não é guardado no browser. */
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
  isEbook?: boolean;
}

/** O que fica guardado no browser por cada linha do carrinho. */
export interface CartLine {
  id: string;
  quantity: number;
  size?: string;
}

/** Campos do produto público (GET /products) usados no carrinho. */
export interface CatalogProduct {
  id: string;
  slug?: string;
  name: string;
  price: number | string;
  images?: string[];
  isEbook?: boolean;
  isFreeEbook?: boolean;
  categorySlug?: string;
}

export const PLACEHOLDER_IMAGE = '/images/placeholder.png';

/**
 * Ebook gratuito: descarrega-se pelo link da página do produto e
 * não entra no carrinho (a API também recusa encomendá-lo).
 */
export function isFreeEbook(product: {
  price: number | string;
  isEbook?: boolean;
  isFreeEbook?: boolean;
  categorySlug?: string;
}): boolean {
  if (product.isFreeEbook) return true;
  const isEbook = product.isEbook || product.categorySlug === 'ebooks';
  return !!isEbook && Number(product.price) === 0;
}

export function toLine(item: CartItem): CartLine {
  return { id: item.id, quantity: item.quantity, ...(item.size ? { size: item.size } : {}) };
}

/** Linhas válidas a partir do que estava guardado (inclui o formato antigo, com preços). */
export function linesFromStorage(raw: unknown): CartLine[] {
  const stored = (raw ?? {}) as { lines?: unknown; items?: unknown };
  const list = stored.lines ?? stored.items;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    const { id, quantity, size } = (entry ?? {}) as Record<string, unknown>;
    const qty = Number(quantity);
    if (typeof id !== 'string' || !id || !Number.isInteger(qty) || qty <= 0) return [];
    return [{ id, quantity: qty, ...(typeof size === 'string' && size ? { size } : {}) }];
  });
}

/** Linha ainda sem dados do catálogo (nome/preço chegam no syncWithCatalog). */
export function pendingItem(line: CartLine): CartItem {
  return { ...line, name: '', price: 0 };
}

/** Atualiza nome, preço e imagem a partir do catálogo; produtos que já não estão à venda saem. */
export function refreshFromCatalog(items: CartItem[], catalog: CatalogProduct[]): CartItem[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return items.flatMap((item) => {
    const product = byId.get(item.id);
    if (!product || isFreeEbook(product)) return [];
    const price = Number(product.price);
    if (!Number.isFinite(price)) return [];
    return [{
      ...toLine(item),
      slug:    product.slug,
      name:    product.name,
      price,
      image:   product.images?.[0] ?? PLACEHOLDER_IMAGE,
      isEbook: product.isEbook ?? product.categorySlug === 'ebooks',
    }];
  });
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}
