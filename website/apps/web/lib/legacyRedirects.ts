// Slugs de produto antigos → slug atual. Cada entrada gera um 301 em todos os idiomas
// (ex: /pt/loja/antigo → /pt/loja/novo e /en/shop/antigo → /en/shop/novo).
// Acrescentar aqui sempre que se muda o slug de um produto já publicado.
export const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  // 'slug-antigo': 'slug-novo',
};

// Outros caminhos antigos (sem prefixo de idioma) → rota interna atual.
// Ex: '/produtos': '/loja' gera /pt/produtos → /pt/loja e /en/produtos → /en/shop.
export const LEGACY_PATHS: Record<string, string> = {
  // '/caminho-antigo': '/loja',
};
