'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-xl text-gray-500 mb-8">{t('empty')}</p>
        <Link href={`/${locale}/loja`} className="btn-primary">
          {t('continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.id}-${item.size}`} className="card p-4 flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                {item.size && (
                  <p className="text-sm text-gray-500">
                    {t('size')}: {item.size}
                  </p>
                )}
                <p className="text-brand-primary font-bold mt-1">
                  €{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => removeItem(item.id, item.size)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  {t('remove')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                    className="border rounded w-8 h-8 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                    className="border rounded w-8 h-8 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="card p-6 h-fit">
          <div className="flex justify-between mb-3">
            <span>{t('subtotal')}</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4 pb-4 border-b">
            <span>{t('shipping')}</span>
            <span className="text-brand-green">A calcular</span>
          </div>
          <div className="flex justify-between font-bold text-lg mb-6">
            <span>{t('total')}</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          <Link href={`/${locale}/checkout`} className="btn-primary w-full text-center block">
            {t('checkout')}
          </Link>
        </div>
      </div>
    </div>
  );
}
