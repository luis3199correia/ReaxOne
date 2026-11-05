import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { countTriggerUnits, eligibleGiftCount, periodsOverlap } from './promotion-rules';

const NAME_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 300;
const MAX_RULE_NUMBER = 100;
const MAX_TRIGGER_UNITS = 20;

export interface PromotionInput {
  name?: string;
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
  requiredUnits?: number;
  giftsPerGroup?: number;
  maxGiftsPerOrder?: number;
  messagePt?: string | null;
  messageEn?: string | null;
  triggers?: Array<{ productId: string; units: number }>;
  gifts?: string[];
}

/** Linha de oferta validada, pronta a entrar na encomenda. */
export interface GiftLine {
  productId: string;
  name: string;
  quantity: number;
}

const PRODUCT_SUMMARY = { id: true, name: true, nameEn: true, color: true, colorEn: true, images: true, stock: true, active: true } as const;

const PROMOTION_INCLUDE = {
  triggers: { include: { product: { select: PRODUCT_SUMMARY } } },
  gifts:    { include: { product: { select: PRODUCT_SUMMARY } } },
} satisfies Prisma.GiftPromotionInclude;

type PromotionWithProducts = Prisma.GiftPromotionGetPayload<{ include: typeof PROMOTION_INCLUDE }>;

function positiveInt(value: unknown, max: number, message: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) throw new BadRequestException(message);
  return n;
}

function requiredDate(value: unknown, message: string): Date {
  if (value === null || value === undefined || value === '') throw new BadRequestException(message);
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new BadRequestException(message);
  return d;
}

function optionalMessage(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new BadRequestException('Texto da promoção inválido.');
  const text = value.trim();
  if (text.length > MESSAGE_MAX_LENGTH) {
    throw new BadRequestException(`O texto da promoção não pode ter mais de ${MESSAGE_MAX_LENGTH} caracteres.`);
  }
  return text || null;
}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  /** Promoções cuja data de fim já passou ficam desativadas automaticamente. */
  private deactivateExpired() {
    return this.prisma.giftPromotion.updateMany({
      where: { active: true, endsAt: { lte: new Date() } },
      data:  { active: false },
    });
  }

  async findAll() {
    await this.deactivateExpired();
    return this.prisma.giftPromotion.findMany({ include: PROMOTION_INCLUDE, orderBy: { startsAt: 'desc' } });
  }

  async create(input: PromotionInput) {
    const { fields, triggers, gifts } = await this.validate(input, null);
    return this.prisma.giftPromotion.create({
      data: {
        ...(fields as Prisma.GiftPromotionCreateInput),
        triggers: { create: triggers ?? [] },
        gifts:    { create: (gifts ?? []).map((productId) => ({ productId })) },
      },
      include: PROMOTION_INCLUDE,
    });
  }

  async update(id: string, input: PromotionInput) {
    const existing = await this.prisma.giftPromotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promoção não encontrada.');
    const { fields, triggers, gifts } = await this.validate(input, existing);

    return this.prisma.$transaction(async (tx) => {
      if (triggers) {
        await tx.giftPromotionTrigger.deleteMany({ where: { promotionId: id } });
        await tx.giftPromotionTrigger.createMany({ data: triggers.map((t) => ({ ...t, promotionId: id })) });
      }
      if (gifts) {
        await tx.giftPromotionGift.deleteMany({ where: { promotionId: id } });
        await tx.giftPromotionGift.createMany({ data: gifts.map((productId) => ({ productId, promotionId: id })) });
      }
      return tx.giftPromotion.update({ where: { id }, data: fields, include: PROMOTION_INCLUDE });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.giftPromotion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Promoção não encontrada.');
    return this.prisma.giftPromotion.delete({ where: { id } });
  }

  /** Promoção ativa e dentro do período neste momento (no máximo uma). */
  async findCurrent(): Promise<PromotionWithProducts | null> {
    await this.deactivateExpired();
    const now = new Date();
    return this.prisma.giftPromotion.findFirst({
      where:   { active: true, startsAt: { lte: now }, endsAt: { gt: now } },
      include: PROMOTION_INCLUDE,
    });
  }

  /** Versão pública: só as ofertas de produtos ativos com stock (as esgotadas ficam escondidas). */
  async findCurrentPublic() {
    const promo = await this.findCurrent();
    if (!promo) return null;
    return {
      id:               promo.id,
      name:             promo.name,
      endsAt:           promo.endsAt,
      requiredUnits:    promo.requiredUnits,
      giftsPerGroup:    promo.giftsPerGroup,
      maxGiftsPerOrder: promo.maxGiftsPerOrder,
      messagePt:        promo.messagePt,
      messageEn:        promo.messageEn,
      triggers: promo.triggers.map((t) => ({ productId: t.productId, units: t.units })),
      gifts: promo.gifts
        .filter((g) => g.product.active && g.product.stock > 0)
        .map((g) => ({
          productId: g.product.id,
          name:      g.product.name,
          nameEn:    g.product.nameEn,
          color:     g.product.color,
          colorEn:   g.product.colorEn,
          image:     g.product.images[0] ?? null,
          stock:     g.product.stock,
        })),
    };
  }

  /**
   * Usado na criação da encomenda: recalcula no servidor a que ofertas o cliente
   * tem direito e valida as cores escolhidas. Obriga a escolher todas as ofertas.
   * O stock é descontado depois, dentro da transação da encomenda.
   */
  async resolveOrderGifts(
    paidItems: Array<{ productId: string; quantity: number }>,
    rawGifts: unknown,
  ): Promise<GiftLine[]> {
    const requested = this.parseRequestedGifts(rawGifts);
    const requestedTotal = requested.reduce((acc, g) => acc + g.quantity, 0);
    const promo = await this.findCurrent();

    if (!promo) {
      if (requestedTotal > 0) throw new BadRequestException('A promoção de oferta já terminou. Atualiza a página.');
      return [];
    }

    const units = new Map(promo.triggers.map((t) => [t.productId, t.units]));
    const available = new Map(
      promo.gifts.filter((g) => g.product.active && g.product.stock > 0).map((g) => [g.productId, g.product]),
    );
    const availableStock = [...available.values()].reduce((acc, p) => acc + p.stock, 0);
    const eligible = eligibleGiftCount(promo, countTriggerUnits(paidItems, units), availableStock);

    if (requestedTotal !== eligible) {
      throw new BadRequestException(
        eligible === 0
          ? 'Esta encomenda não tem direito a ofertas. Atualiza a página.'
          : `Escolhe a cor de ${eligible} oferta${eligible !== 1 ? 's' : ''} antes de finalizar a encomenda.`,
      );
    }

    return requested.map((g) => {
      const product = available.get(g.productId);
      if (!product) throw new BadRequestException('Uma das ofertas escolhidas já não está disponível.');
      if (g.quantity > product.stock) throw new BadRequestException(`Sem stock suficiente para a oferta "${product.name}".`);
      return { productId: product.id, name: product.name, quantity: g.quantity };
    });
  }

  /** Junta linhas repetidas do mesmo produto e valida o formato. */
  private parseRequestedGifts(raw: unknown): Array<{ productId: string; quantity: number }> {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) throw new BadRequestException('Ofertas inválidas.');
    const byProduct = new Map<string, number>();
    for (const g of raw) {
      if (typeof g?.productId !== 'string' || !Number.isInteger(g?.quantity) || g.quantity < 1 || g.quantity > MAX_RULE_NUMBER) {
        throw new BadRequestException('Ofertas inválidas.');
      }
      byProduct.set(g.productId, (byProduct.get(g.productId) ?? 0) + g.quantity);
    }
    return [...byProduct].map(([productId, quantity]) => ({ productId, quantity }));
  }

  /** Valida o input do backoffice. `existing` é null na criação. */
  private async validate(
    input: PromotionInput,
    existing: { id: string; active: boolean; startsAt: Date; endsAt: Date } | null,
  ) {
    const fields: Prisma.GiftPromotionUpdateInput = {};
    const isCreate = existing === null;

    if (isCreate || input.name !== undefined) {
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (!name || name.length > NAME_MAX_LENGTH) throw new BadRequestException('Indica um nome para a promoção (até 100 caracteres).');
      fields.name = name;
    }
    if (isCreate || input.startsAt !== undefined) fields.startsAt = requiredDate(input.startsAt, 'Indica uma data de início válida.');
    if (isCreate || input.endsAt !== undefined) fields.endsAt = requiredDate(input.endsAt, 'Indica uma data de fim válida.');
    if (isCreate || input.requiredUnits !== undefined) {
      fields.requiredUnits = positiveInt(input.requiredUnits, MAX_RULE_NUMBER, 'O número de unidades a comprar tem de ser um inteiro entre 1 e 100.');
    }
    if (isCreate || input.giftsPerGroup !== undefined) {
      fields.giftsPerGroup = positiveInt(input.giftsPerGroup, MAX_RULE_NUMBER, 'O número de ofertas por grupo tem de ser um inteiro entre 1 e 100.');
    }
    if (isCreate || input.maxGiftsPerOrder !== undefined) {
      fields.maxGiftsPerOrder = positiveInt(input.maxGiftsPerOrder, MAX_RULE_NUMBER, 'O máximo de ofertas por encomenda tem de ser um inteiro entre 1 e 100.');
    }
    if (input.messagePt !== undefined) fields.messagePt = optionalMessage(input.messagePt);
    if (input.messageEn !== undefined) fields.messageEn = optionalMessage(input.messageEn);

    // Na criação fica ativa por omissão
    const active = input.active !== undefined ? input.active === true : existing?.active ?? true;
    fields.active = active;
    const startsAt = (fields.startsAt as Date | undefined) ?? existing!.startsAt;
    const endsAt = (fields.endsAt as Date | undefined) ?? existing!.endsAt;

    if (endsAt <= startsAt) throw new BadRequestException('A data de fim tem de ser posterior à data de início.');
    if (active && endsAt <= new Date()) {
      throw new BadRequestException('A data de fim já passou — altera a data de fim para ativar a promoção.');
    }

    const triggers = await this.validateTriggers(input.triggers, isCreate);
    const gifts = await this.validateGifts(input.gifts, isCreate);
    if (triggers && gifts && triggers.some((t) => gifts.includes(t.productId))) {
      throw new BadRequestException('Um produto não pode ser ao mesmo tempo produto da compra e oferta.');
    }

    if (active) await this.assertNoOverlap(startsAt, endsAt, existing?.id);

    return { fields, triggers, gifts };
  }

  private async validateTriggers(raw: PromotionInput['triggers'], required: boolean) {
    if (raw === undefined && !required) return undefined;
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new BadRequestException('Escolhe pelo menos um produto que dá direito à oferta.');
    }
    const byProduct = new Map<string, number>();
    for (const t of raw) {
      if (typeof t?.productId !== 'string') throw new BadRequestException('Produto inválido na promoção.');
      byProduct.set(t.productId, positiveInt(t.units, MAX_TRIGGER_UNITS, 'As unidades por produto têm de ser um inteiro entre 1 e 20.'));
    }
    await this.assertProductsExist([...byProduct.keys()]);
    return [...byProduct].map(([productId, units]) => ({ productId, units }));
  }

  private async validateGifts(raw: PromotionInput['gifts'], required: boolean) {
    if (raw === undefined && !required) return undefined;
    if (!Array.isArray(raw) || raw.length === 0 || raw.some((id) => typeof id !== 'string')) {
      throw new BadRequestException('Escolhe pelo menos um produto de oferta.');
    }
    const ids = [...new Set(raw)];
    await this.assertProductsExist(ids);
    return ids;
  }

  private async assertProductsExist(ids: string[]) {
    const count = await this.prisma.product.count({ where: { id: { in: ids } } });
    if (count !== ids.length) throw new BadRequestException('Um dos produtos escolhidos já não existe.');
  }

  /** Só pode haver uma promoção ativa em cada período. */
  private async assertNoOverlap(startsAt: Date, endsAt: Date, excludeId?: string) {
    const others = await this.prisma.giftPromotion.findMany({
      where:  { active: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { name: true, startsAt: true, endsAt: true },
    });
    const clash = others.find((o) => periodsOverlap(startsAt, endsAt, o.startsAt, o.endsAt));
    if (clash) {
      throw new BadRequestException(
        `Já existe uma promoção ativa nesse período ("${clash.name}"). Desativa-a ou muda as datas — só pode haver uma promoção de cada vez.`,
      );
    }
  }
}
