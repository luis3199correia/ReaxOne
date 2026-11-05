'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Gift, Minus, Plus } from 'lucide-react';
import {
  CurrentPromotion,
  GiftSelection,
  giftLabel,
  promotionMessage,
  selectedCount,
} from '@/lib/giftPromotion';

interface GiftPickerProps {
  promotion: CurrentPromotion;
  eligible: number;
  missingUnits: number;
  selection: GiftSelection;
  onChange: (selection: GiftSelection) => void;
  showError: boolean;
}

// Escolha da cor das ofertas no checkout (obrigatória antes de finalizar)
export default function GiftPicker({ promotion, eligible, missingUnits, selection, onChange, showError }: GiftPickerProps) {
  const t = useTranslations('gift');
  const locale = useLocale();
  const chosen = selectedCount(selection);
  const message = promotionMessage(promotion, locale);

  function setQuantity(productId: string, quantity: number) {
    const { [productId]: _removed, ...rest } = selection;
    onChange(quantity > 0 ? { ...rest, [productId]: quantity } : rest);
  }

  return (
    <div className={`card p-6 border-l-4 ${showError && chosen !== eligible ? 'border-red-400' : 'border-brand-green'}`}>
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Gift className="w-5 h-5 text-brand-green" />
        {t('title')}
      </h2>
      {message && <p className="text-sm text-gray-600 mb-3">{message}</p>}

      {eligible > 0 && (
        <>
          <p className="text-sm font-medium mb-3">{t('eligible', { count: eligible })}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {promotion.gifts.map((gift) => {
              const quantity = selection[gift.productId] ?? 0;
              const label = giftLabel(gift, locale);
              const canAdd = chosen < eligible && quantity < gift.stock;
              return (
                <div
                  key={gift.productId}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg ${quantity > 0 ? 'border-brand-green bg-green-50' : 'border-gray-200'}`}
                >
                  <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={gift.image ?? '/images/placeholder.png'} alt={label} fill className="object-cover" sizes="48px" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(gift.productId, quantity - 1)}
                      disabled={quantity === 0}
                      aria-label={t('remove', { name: label })}
                      className="border rounded w-7 h-7 flex items-center justify-center disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center text-sm">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(gift.productId, quantity + 1)}
                      disabled={!canAdd}
                      aria-label={t('add', { name: label })}
                      className="border rounded w-7 h-7 flex items-center justify-center disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={`text-xs mt-3 ${chosen === eligible ? 'text-brand-green font-medium' : showError ? 'text-red-500' : 'text-gray-500'}`}>
            {showError && chosen !== eligible ? t('must_choose') : t('chosen', { chosen, total: eligible })}
          </p>
        </>
      )}

      {missingUnits > 0 && (
        <p className="text-xs text-gray-500 mt-3">{t('missing', { count: missingUnits })}</p>
      )}
    </div>
  );
}
