/**
 * Estado de navegação da loja (categoria + ordenação) no URL, e o último usado
 * guardado na sessão para o breadcrumb da página de produto voltar ao mesmo sítio.
 */

export type SortKey = 'newest' | 'price_asc' | 'price_desc';

/** Valores de ?ordem= no URL (legíveis e estáveis). */
const SORT_PARAM: Record<Exclude<SortKey, 'newest'>, string> = {
  price_asc:  'preco-asc',
  price_desc: 'preco-desc',
};

// `type` (e não `interface`) para ser aceite como query do router/Link
export type ShopQuery = {
  categoria?: string;
  ordem?: string;
};

const STORAGE_KEY = 'reaxone_shop_query';
// Os slugs vêm do backoffice e podem ter espaços/acentos (ex: "bolas de reação"):
// aceitam-se tal como estão, só com limite de tamanho (o router codifica-os no URL)
const MAX_CATEGORY_LENGTH = 100;

function isValidCategory(category: string | undefined): category is string {
  return !!category && category.trim().length > 0 && category.length <= MAX_CATEGORY_LENGTH;
}

export function sortFromParam(param: string | null): SortKey {
  const entry = Object.entries(SORT_PARAM).find(([, value]) => value === param);
  return (entry?.[0] as SortKey | undefined) ?? 'newest';
}

export function sortToParam(sort: SortKey): string | undefined {
  return sort === 'newest' ? undefined : SORT_PARAM[sort];
}

/** Query da loja só com valores válidos (sem chaves vazias). */
export function shopQuery(category: string | undefined, sort: SortKey): ShopQuery {
  const ordem = sortToParam(sort);
  return {
    ...(isValidCategory(category) ? { categoria: category } : {}),
    ...(ordem ? { ordem } : {}),
  };
}

export function saveShopQuery(query: ShopQuery) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(query));
  } catch {
    // armazenamento bloqueado: o breadcrumb usa a categoria do produto
  }
}

export function readShopQuery(): ShopQuery | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as ShopQuery | null;
    if (!raw || typeof raw !== 'object') return null;
    return shopQuery(
      typeof raw.categoria === 'string' ? raw.categoria : undefined,
      sortFromParam(typeof raw.ordem === 'string' ? raw.ordem : null),
    );
  } catch {
    return null;
  }
}
