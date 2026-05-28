'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCartStore } from '@/store/cart';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category?: string;
  stock: number;
  badge?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = product.stock === 0;
  const imageSrc = product.images[0] ?? '/images/placeholder.png';

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imageSrc,
      quantity: 1,
    });
  }

  return (
    <Link
      href={`/${locale}/loja/${product.slug}`}
      className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-brand-light overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-brand-green text-brand-dark text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
            {product.badge}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-brand-dark text-sm font-semibold px-4 py-2 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs text-brand-muted uppercase tracking-wider mb-1">
            {product.category}
          </span>
        )}
        <h3 className="font-semibold text-brand-dark leading-snug mb-2 flex-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-brand-dark">
            €{product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
