'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Espelha a regra do servidor (api/src/promotions/promotion-rules.ts).
// O servidor recalcula sempre — isto serve só para mostrar ao cliente.

export interface PromotionGift {
  productId: string;
  name: string;
  nameEn: string | null;
  color: string | null;
  colorEn: string | null;
  image: string | null;
  stock: number;
}

export interface CurrentPromotion {
  id: string;
  name: string;
  endsAt: string;
  requiredUnits: number;
  giftsPerGroup: number;
  maxGiftsPerOrder: number;
  messagePt: string | null;
  messageEn: string | null;
  triggers: Array<{ productId: string; units: number }>;
  gifts: PromotionGift[];
}

export type GiftSelection = Record<string, number>; // productId → quantidade

export interface GiftStatus {
  eligible: number;      // ofertas a que tem direito agora
  missingUnits: number;  // unidades em falta para a próxima oferta (0 se já está no máximo)
  atMax: boolean;
}

export function giftStatus(promo: CurrentPromotion, items: Array<{ id: string; quantity: number }>): GiftStatus {
  const units = new Map(promo.triggers.map((t) => [t.productId, t.units]));
  const triggerUnits = items.reduce((acc, i) => acc + i.quantity * (units.get(i.id) ?? 0), 0);
  const availableStock = promo.gifts.reduce((acc, g) => acc + g.stock, 0);
  const byRule = Math.floor(triggerUnits / promo.requiredUnits) * promo.giftsPerGroup;
  const cap = Math.min(promo.maxGiftsPerOrder, availableStock);
  const eligible = Math.max(0, Math.min(byRule, cap));
  const atMax = eligible >= cap;
  const missingUnits = atMax ? 0 : promo.requiredUnits - (triggerUnits % promo.requiredUnits);
  return { eligible, missingUnits, atMax };
}

export function selectedCount(selection: GiftSelection): number {
  return Object.values(selection).reduce((acc, n) => acc + n, 0);
}

export function giftLabel(gift: PromotionGift, locale: string): string {
  return (locale === 'en' && gift.nameEn) || gift.name;
}

export function promotionMessage(promo: CurrentPromotion, locale: string): string | null {
  return (locale === 'en' && promo.messageEn) || promo.messagePt || null;
}

/** Promoção em vigor (null se não houver ou se a API falhar). */
export function useCurrentPromotion() {
  const [promotion, setPromotion] = useState<CurrentPromotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/promotions/current')
      .then((res) => { if (!cancelled) setPromotion(res.data || null); })
      .catch(() => { if (!cancelled) setPromotion(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { promotion, loading };
}
