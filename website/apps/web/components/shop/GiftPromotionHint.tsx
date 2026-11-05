'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Gift } from 'lucide-react';
import { giftStatus, promotionMessage, useCurrentPromotion } from '@/lib/giftPromotion';

// Aviso no carrinho: quantas ofertas o cliente já ganhou e quanto falta para a próxima
export default function GiftPromotionHint({ items }: { items: Array<{ id: string; quantity: number }> }) {
  const t = useTranslations('gift');
  const locale = useLocale();
  const { promotion } = useCurrentPromotion();
  if (!promotion || promotion.gifts.length === 0) return null;

  const { eligible, missingUnits } = giftStatus(promotion, items);
  const message = promotionMessage(promotion, locale);
  if (eligible === 0 && missingUnits === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-900">
      <p className="font-semibold flex items-center gap-2">
        <Gift className="w-4 h-4" />
        {message ?? t('title')}
      </p>
      {eligible > 0 && (
        <p className="mt-1">{t('eligible_cart', { count: eligible })} {t('pick_in_checkout')}</p>
      )}
      {missingUnits > 0 && <p className="mt-1 text-xs">{t('missing', { count: missingUnits })}</p>}
    </div>
  );
}
