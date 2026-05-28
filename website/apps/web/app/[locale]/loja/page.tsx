'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard, { Product } from '@/components/shop/ProductCard';
import { ChevronDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

function toProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    images: p.images ?? [],
    category: p.category?.name ?? undefined,
    stock: p.stock,
  };
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialCatSlug = searchParams.get('categoria') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [sort, setSort] = useState<SortKey>('newest');
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    // Carrega produtos e categorias visíveis em paralelo
    Promise.all([
      api.get('/products'),
      api.get('/categories'),  // só as visíveis
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data.map(toProduct));

      const catNames: string[] = catRes.data.map((c: any) => c.name);
      setCategories(catNames);

      // Resolve a categoria inicial da querystring
      if (initialCatSlug) {
        const match = catRes.data.find(
          (c: any) => c.slug === initialCatSlug || c.slug.includes(initialCatSlug)
        );
        if (match) setActiveCategory(match.name);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [initialCatSlug]);

  const allCategories = ['Todos', ...categories];

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'Todos') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, activeCategory, sort]);

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-brand-light border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-brand-dark mb-1">Loja</h1>
          <p className="text-brand-muted">Equipamento desportivo de alta performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">

        {/* Sidebar — desktop */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-4">
              Categoria
            </h2>
            <ul className="space-y-1">
              {allCategories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat
                        ? 'bg-brand-primary text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
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
              Filtros <ChevronDown className={`w-4 h-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            <span className="text-sm text-brand-muted hidden md:block">
              {loading ? '...' : `${filtered.length} ${filtered.length === 1 ? 'produto' : 'produtos'}`}
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <label htmlFor="sort" className="text-sm text-brand-muted whitespace-nowrap hidden sm:block">
                Ordenar por
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="newest">Mais recentes</option>
                <option value="price_asc">Preço: crescente</option>
                <option value="price_desc">Preço: decrescente</option>
              </select>
            </div>
          </div>

          {/* Mobile filters */}
          {mobileFiltersOpen && (
            <div className="md:hidden flex flex-wrap gap-2 mb-6">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setMobileFiltersOpen(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-32 text-brand-muted">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span>A carregar produtos...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="py-24 text-center text-brand-muted">
              <p className="text-lg">Nenhum produto encontrado nesta categoria.</p>
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
