import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateDiscount, normalizeCode } from './discount-rules';

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;
const MAX_PERCENTAGE = 100;
const INVALID_CODE = 'Código de desconto inválido.';

export interface DiscountInput {
  code?: string;
  description?: string | null;
  type?: DiscountType;
  value?: number;
  active?: boolean;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
}

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(input: DiscountInput) {
    const data = this.toData(input, null) as Prisma.DiscountCodeCreateInput;
    try {
      return await this.prisma.discountCode.create({ data });
    } catch (e) {
      throw this.mapUniqueError(e);
    }
  }

  async update(id: string, input: DiscountInput) {
    const existing = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Código de desconto não encontrado.');
    try {
      return await this.prisma.discountCode.update({ where: { id }, data: this.toData(input, existing) });
    } catch (e) {
      throw this.mapUniqueError(e);
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.discountCode.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Código de desconto não encontrado.');
    return this.prisma.discountCode.delete({ where: { id } });
  }

  /** Pré-visualização pública no checkout — não consome o código. */
  async preview(rawCode: unknown, rawSubtotal: unknown) {
    const code = normalizeCode(rawCode);
    const subtotal = Number(rawSubtotal);
    if (!code || !Number.isFinite(subtotal) || subtotal < 0) throw new BadRequestException(INVALID_CODE);

    const discount = await this.prisma.discountCode.findUnique({ where: { code } });
    if (!discount) throw new BadRequestException(INVALID_CODE);
    const check = evaluateDiscount(discount, subtotal);
    if (check.reason) throw new BadRequestException(check.reason);
    return { code: discount.code, type: discount.type, value: discount.value, amount: check.amount };
  }

  /**
   * Usado na criação da encomenda, dentro da transação: valida o código e
   * consome uma utilização de forma atómica (respeita o maxUses mesmo com
   * encomendas em simultâneo).
   */
  async redeem(tx: Prisma.TransactionClient, rawCode: unknown, subtotal: number) {
    const code = normalizeCode(rawCode);
    if (!code) return null;

    const discount = await tx.discountCode.findUnique({ where: { code } });
    if (!discount) throw new BadRequestException(INVALID_CODE);
    const check = evaluateDiscount(discount, subtotal);
    if (check.reason) throw new BadRequestException(check.reason);

    const updated = await tx.discountCode.updateMany({
      where: {
        id: discount.id,
        active: true,
        ...(discount.maxUses != null ? { usedCount: { lt: discount.maxUses } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new BadRequestException('Este código de desconto já não está disponível.');
    }
    return { code: discount.code, amount: check.amount };
  }

  private mapUniqueError(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('Já existe um código de desconto com esse nome.');
    }
    return e;
  }

  /** Valida o input do backoffice e converte-o em dados Prisma. */
  private toData(
    input: DiscountInput,
    existing: { type: DiscountType; value: number; startsAt: Date | null; expiresAt: Date | null } | null,
  ): Prisma.DiscountCodeUpdateInput {
    const isCreate = existing === null;
    const data: Prisma.DiscountCodeUpdateInput = {};

    if (isCreate || input.code !== undefined) {
      const code = normalizeCode(input.code);
      if (!CODE_PATTERN.test(code)) {
        throw new BadRequestException('O código deve ter 3 a 32 caracteres (letras, números, - ou _).');
      }
      data.code = code;
    }
    if (isCreate || input.type !== undefined) {
      if (input.type !== 'PERCENTAGE' && input.type !== 'FIXED') throw new BadRequestException('Tipo de desconto inválido.');
      data.type = input.type;
    }
    if (isCreate || input.value !== undefined) {
      const value = Number(input.value);
      if (!Number.isFinite(value) || value <= 0) throw new BadRequestException('O valor do desconto tem de ser maior que zero.');
      data.value = value;
    }

    const finalType = (data.type as DiscountType | undefined) ?? existing?.type;
    const finalValue = (data.value as number | undefined) ?? existing?.value ?? 0;
    if (finalType === 'PERCENTAGE' && finalValue > MAX_PERCENTAGE) {
      throw new BadRequestException('A percentagem não pode ser superior a 100.');
    }

    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.active !== undefined) data.active = Boolean(input.active);
    if (input.minOrderAmount !== undefined) {
      data.minOrderAmount = this.optionalNumber(input.minOrderAmount, 'Compra mínima inválida.');
    }
    if (input.maxUses !== undefined) {
      const maxUses = this.optionalNumber(input.maxUses, 'Limite de utilizações inválido.');
      if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) throw new BadRequestException('Limite de utilizações inválido.');
      data.maxUses = maxUses;
    }
    if (input.startsAt !== undefined) data.startsAt = this.optionalDate(input.startsAt);
    if (input.expiresAt !== undefined) data.expiresAt = this.optionalDate(input.expiresAt);

    const finalStart = input.startsAt !== undefined ? (data.startsAt as Date | null) : existing?.startsAt ?? null;
    const finalEnd = input.expiresAt !== undefined ? (data.expiresAt as Date | null) : existing?.expiresAt ?? null;
    if (finalStart && finalEnd && finalStart > finalEnd) {
      throw new BadRequestException('A data de início tem de ser anterior à data de fim.');
    }
    return data;
  }

  private optionalNumber(value: unknown, message: string): number | null {
    if (value === null || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw new BadRequestException(message);
    return n;
  }

  private optionalDate(value: unknown): Date | null {
    if (value === null || value === '') return null;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida.');
    return d;
  }
}
