'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ShoppingCart, ChevronLeft, Check, Shield, Truck, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import ProductCard, { Product } from '@/components/shop/ProductCard';
import { api } from '@/lib/api';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

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

export default function ProductPage({ params: paramsPromise }: Props) {
  const { slug } = use(paramsPromise);
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then((res) => {
        setProduct(toProduct(res.data));
        setActiveImg(0);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // Busca produtos relacionados
    api.get('/products')
      .then((res) => {
        const all: Product[] = res.data.map(toProduct);
        setRelated(all.filter((p) => p.slug !== slug).slice(0, 4));
      })
      .catch(() => {});
  }, [slug]);

  function handleAddToCart() {
    if (!product || product.stock === 0) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-brand-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span>A carregar produto...</span>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-xl text-gray-500 mb-6">Produto não encontrado.</p>
        <Link href={`/${locale}/loja`} className="btn-primary">
          Ver toda a loja
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-8">
          <Link href={`/${locale}/loja`} className="hover:text-brand-primary flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Loja
          </Link>
          <span>/</span>
          <span className="text-brand-dark font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

          {/* Galeria */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-light">
              <Image
                src={product.images[activeImg] ?? '/images/produtos/bola-reacao-verde-splash.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-brand-green text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {product.badge}
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-brand-primary' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.category && (
              <span className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-2">
                {product.category}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4 leading-tight">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-brand-primary mb-6">
              €{product.price.toFixed(2)}
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              A Bola de Reação ReaxOne foi desenvolvida para treinar reflexos, coordenação e velocidade de resposta.
              Ideal para atletas de todas as modalidades — futebol, padel, ténis, boxe e muito mais.
              O design irregular garante ressaltos imprevisíveis que desafiam o teu tempo de reação ao máximo.
            </p>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {isOutOfStock ? (
                <span className="text-sm text-red-500 font-medium">Esgotado</span>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-brand-green" />
                  <span className="text-sm text-gray-600">Em stock ({product.stock} unidades)</span>
                </>
              )}
            </div>

            {/* Quantidade */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-brand-dark mb-3">Quantidade</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={isOutOfStock}
                  className="border-2 border-gray-300 rounded-xl w-11 h-11 flex items-center justify-center text-xl font-medium hover:border-brand-primary transition-colors disabled:opacity-40"
                >
                  −
                </button>
                <span className="text-xl font-bold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={isOutOfStock}
                  className="border-2 border-gray-300 rounded-xl w-11 h-11 flex items-center justify-center text-xl font-medium hover:border-brand-primary transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-3 w-full py-4 rounded-xl text-lg font-bold transition-all duration-200 mb-4 ${
                added
                  ? 'bg-brand-green text-brand-dark'
                  : isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-red-700'
              }`}
            >
              {added
                ? <><Check className="w-5 h-5" /> Adicionado ao carrinho!</>
                : <><ShoppingCart className="w-5 h-5" /> Adicionar ao carrinho</>
              }
            </button>

            {/* Trust badges */}
            <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Envio grátis em encomendas acima de €50</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Pagamento seguro via MB Way ou transferência</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                <span>Devoluções gratuitas em 30 dias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Produtos relacionados */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-brand-dark mb-8">Também podes gostar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
