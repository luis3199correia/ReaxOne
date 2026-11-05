// Regras puras da oferta automática (sem acesso à base de dados)

export interface PromotionRule {
  requiredUnits: number;
  giftsPerGroup: number;
  maxGiftsPerOrder: number;
}

/** Unidades gatilho no carrinho: soma quantidade × unidades do produto (ex.: pack de 2 bolas = 2). */
export function countTriggerUnits(
  items: Array<{ productId: string; quantity: number }>,
  unitsByProduct: Map<string, number>,
): number {
  return items.reduce((acc, i) => acc + i.quantity * (unitsByProduct.get(i.productId) ?? 0), 0);
}

/** Número de ofertas a que o cliente tem direito, limitado ao stock disponível. */
export function eligibleGiftCount(rule: PromotionRule, triggerUnits: number, availableGiftStock: number): number {
  if (rule.requiredUnits < 1 || triggerUnits < rule.requiredUnits) return 0;
  const byRule = Math.floor(triggerUnits / rule.requiredUnits) * rule.giftsPerGroup;
  return Math.max(0, Math.min(byRule, rule.maxGiftsPerOrder, availableGiftStock));
}

/** Os períodos [aStart, aEnd) e [bStart, bEnd) sobrepõem-se? */
export function periodsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
