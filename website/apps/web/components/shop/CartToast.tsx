'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ShoppingCart, X, Check } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export default function CartToast() {
  const locale = useLocale();
  const { lastAdded, clearLastAdded, items } = useCartStore();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    if (!lastAdded) return;

    setLeaving(false);
    setVisible(true);

    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        setVisible(false);
        clearLastAdded();
      }, 300);
    }, 3500);

    return () => clearTimeout(timer);
  }, [lastAdded, clearLastAdded]);

  if (!visible || !lastAdded) return null;

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${
        leaving ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-brand-green px-4 py-2.5">
        <div className="flex items-center gap-2 text-brand-dark font-semibold text-sm">
          <Check className="w-4 h-4" />
          Adicionado ao carrinho!
        </div>
        <button
          onClick={() => { setLeaving(true); setTimeout(() => { setVisible(false); clearLastAdded(); }, 300); }}
          className="text-brand-dark/60 hover:text-brand-dark transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Product */}
      <div className="flex items-center gap-3 p-4">
        {lastAdded.image ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-light flex-shrink-0">
            <Image src={lastAdded.image} alt={lastAdded.name} fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-brand-light flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-dark text-sm leading-snug truncate">{lastAdded.name}</p>
          {lastAdded.size && <p className="text-xs text-gray-400 mt-0.5">Tamanho: {lastAdded.size}</p>}
          <p className="text-brand-primary font-bold text-sm mt-1">€{lastAdded.price.toFixed(2)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => { setLeaving(true); setTimeout(() => { setVisible(false); clearLastAdded(); }, 300); }}
          className="flex-1 btn-secondary py-2 text-sm"
        >
          Continuar
        </button>
        <Link
          href={`/${locale}/carrinho`}
          onClick={() => { setVisible(false); clearLastAdded(); }}
          className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-4 h-4" />
          Ver carrinho ({cartCount})
        </Link>
      </div>
    </div>
  );
}
