'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import ProductCard, { Product } from '@/components/shop/ProductCard';
import { ChevronDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useCategoryLabel } from '@/lib/category';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

function toProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn ?? undefined,
    slug: p.slug,
    price: p.price,
    images: p.images ?? [],
    category: p.category?.name ?? undefined,
    categoryEn: p.category?.nameEn ?? undefined,
    categorySlug: p.category?.slug ?? undefined,
    stock: p.stock,
    isEbook: p.category?.slug === 'ebooks' || !!p.isEbook,
  };
}

const ALL_KEY = '__all__';

type Category = { name: string; nameEn?: string; slug: string };

// ?categoria=bolas → slug exato, ou um slug que o contenha (ex: 'bolas-de-reacao').
// Categoria desconhecida → todos os produtos (os links dos QR codes nunca dão página vazia).
function resolveCategory(param: string, categories: Category[]): string {
  if (!param) return ALL_KEY;
  const match = categories.find((c) => c.slug === param) ?? categories.find((c) => c.slug.includes(param));
  return match?.slug ?? ALL_KEY;
}

export default function ShopPage() {
  const t = useTranslations('shop');
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('categoria') ?? '';

  const categoryLabel = useCategoryLabel();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // A categoria ativa vive no URL: partilhável e mantida ao trocar de idioma
  const activeCategory = useMemo(() => resolveCategory(categoryParam, categories), [categoryParam, categories]);
  const [sort, setSort] = useState<SortKey>('newest');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    // Carrega produtos e categorias visíveis em paralelo
    Promise.all([
      api.get('/products'),
      api.get('/categories'),  // só as visíveis
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data.map(toProduct));

      setCategories(catRes.data.map((c: any) => ({ name: c.name, nameEn: c.nameEn ?? undefined, slug: c.slug })));
    }).catch((err) => {
      console.error('[Loja] Erro ao carregar produtos/categorias:', err);
      setLoadError(true);
    }).finally(() => setLoading(false));
  }, []);

  function selectCategory(slug: string) {
    const href = slug === ALL_KEY ? { pathname: '/loja' as const } : { pathname: '/loja' as const, query: { categoria: slug } };
    router.replace(href, { scroll: false });
  }

  const allCategories = [ALL_KEY, ...categories.map((c) => c.slug)];

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== ALL_KEY) {
      const catObj = categories.find((c) => c.slug === activeCategory);
      if (catObj) list = list.filter((p) => p.category === catObj.name);
    }
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, categories, activeCategory, sort]);

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-brand-light border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-brand-dark mb-1">{t('title')}</h1>
          <p className="text-brand-muted">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">

        {/* Sidebar — desktop */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">
              {t('category_label')}
            </h2>
            <ul className="space-y-1">
              {allCategories.map((slug) => {
                const catObj = categories.find((c) => c.slug === slug);
                const label = catObj ? categoryLabel(catObj.name, catObj.slug, catObj.nameEn) : t('all_categories');
                return (
                  <li key={slug}>
                    <button
                      onClick={() => selectCategory(slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === slug
                          ? 'bg-brand-primary text-white font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              className="md:hidden flex items-center gap-2 text-sm font-medium border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              {t('filters')} <ChevronDown className={`w-4 h-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            <span className="text-sm text-brand-muted hidden md:block">
              {loading ? '...' : `${filtered.length} ${filtered.length === 1 ? t('product_singular') : t('product_plural')}`}
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <label htmlFor="sort" className="text-sm text-brand-muted whitespace-nowrap hidden sm:block">
                {t('sort_by')}
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="newest">{t('sort_newest')}</option>
                <option value="price_asc">{t('sort_price_asc')}</option>
                <option value="price_desc">{t('sort_price_desc')}</option>
              </select>
            </div>
          </div>

          {/* Mobile filters */}
          {mobileFiltersOpen && (
            <div className="md:hidden flex flex-wrap gap-2 mb-6">
              {allCategories.map((slug) => {
                const catObj = categories.find((c) => c.slug === slug);
                const label = catObj ? categoryLabel(catObj.name, catObj.slug, catObj.nameEn) : t('all_categories');
                return (
                  <button
                    key={slug}
                    onClick={() => { selectCategory(slug); setMobileFiltersOpen(false); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === slug
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-32 text-brand-muted">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span>{t('loading_products')}</span>
            </div>
          )}

          {/* Erro ao carregar */}
          {!loading && loadError && (
            <div className="py-24 text-center text-red-500">
              <p className="text-lg">Não foi possível carregar os produtos. Tenta atualizar a página.</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="py-24 text-center text-brand-muted">
              <p className="text-lg">{t('no_products_category')}</p>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
