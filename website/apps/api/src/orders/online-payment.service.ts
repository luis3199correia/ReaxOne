import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IfthenpayClient } from '../payments/ifthenpay.client';
import { GATEWAY_RETURN_PARAM, OnlineMethod, paymentDeadline, providerRefFor } from '../payments/ifthenpay.rules';

const EXPIRY_SWEEP_INTERVAL_MS = 5 * 60_000;
const ONLINE_PAYMENT_METHODS: PaymentMethod[] = ['MBWAY', 'MULTIBANCO', 'CARD', 'APPLE_PAY', 'GOOGLE_PAY'];

/** O que o checkout tem de fazer a seguir para o cliente pagar. */
export type PaymentAction =
  | { type: 'mbway'; phone: string }
  | { type: 'multibanco'; entity: string; reference: string; expiresAt: string | null }
  | { type: 'redirect'; url: string };

interface StartInput {
  order: { id: string; email: string; firstName: string; lastName: string; totalAmount: number };
  method: OnlineMethod;
  mbwayPhone: string | null; // já normalizado ("351#9XXXXXXXX")
  lang: 'pt' | 'en';
}

/**
 * Pagamentos IfthenPay: cria o pedido de pagamento de uma encomenda e cancela
 * (com reposição de stock e do código de desconto) as que não forem pagas a tempo.
 */
@Injectable()
export class OnlinePaymentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OnlinePaymentService.name);
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private ifthenpay: IfthenpayClient,
  ) {}

  onModuleInit() {
    this.sweepTimer = setInterval(() => {
      this.cancelExpired().catch((e) => this.logger.error('[Pagamentos] Erro ao cancelar encomendas expiradas', e));
    }, EXPIRY_SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  async start({ order, method, mbwayPhone, lang }: StartInput): Promise<PaymentAction> {
    const orderRef = providerRefFor(order.id);
    const description = `ReaxOne #${order.id.slice(-8).toUpperCase()}`;
    // Guardado antes de chamar a IfthenPay, para o callback encontrar sempre a encomenda
    await this.savePayment(order.id, { providerRef: orderRef });

    if (method === 'MBWAY') {
      const { requestId } = await this.ifthenpay.requestMbway({
        orderRef, amount: order.totalAmount, phone: mbwayPhone ?? '', email: order.email, description,
      });
      await this.savePayment(order.id, { requestId });
      return { type: 'mbway', phone: (mbwayPhone ?? '').replace('351#', '') };
    }

    if (method === 'MULTIBANCO') {
      const mb = await this.ifthenpay.createMultibancoReference({
        orderRef, amount: order.totalAmount, description, email: order.email,
        name: `${order.firstName} ${order.lastName}`.trim(),
      });
      await this.savePayment(order.id, {
        requestId: mb.requestId, entity: mb.entity, reference: mb.reference, expiresAt: mb.expiresAt,
      });
      return { type: 'multibanco', entity: mb.entity, reference: mb.reference, expiresAt: mb.expiresAt?.toISOString() ?? null };
    }

    return this.startGateway(order.id, orderRef, order.totalAmount, description, method, lang);
  }

  /** Estado público de um pagamento (o id da encomenda não é adivinhável). */
  async status(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where:  { orderId },
      select: { status: true, order: { select: { status: true } } },
    });
    if (!payment) return null;
    return { paymentStatus: payment.status, orderStatus: payment.order.status };
  }

  /**
   * Cancela uma encomenda que ainda aguarda pagamento: repõe o stock (produtos
   * físicos e ofertas) e devolve a utilização do código de desconto.
   * Devolve false se a encomenda já não estava à espera de pagamento.
   */
  async cancelUnpaid(orderId: string, paymentStatus: 'EXPIRED' | 'FAILED'): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: 'AWAITING_PAYMENT' },
        data:  { status: 'CANCELLED' },
      });
      if (updated.count === 0) return false;

      await tx.payment.updateMany({ where: { orderId, status: 'PENDING' }, data: { status: paymentStatus } });

      const order = await tx.order.findUnique({
        where:   { id: orderId },
        include: { items: { include: { product: { select: { ebookFile: true } } } } },
      });
      for (const item of order?.items ?? []) {
        if (item.product?.ebookFile) continue; // ebooks não descontam stock
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      if (order?.discountCode) {
        await tx.discountCode.updateMany({
          where: { code: order.discountCode, usedCount: { gt: 0 } },
          data:  { usedCount: { decrement: 1 } },
        });
      }
      return true;
    });
  }

  /** Cancelamento comunicado pela IfthenPay (cliente desistiu na página de pagamento). */
  async cancelByProviderRef(providerRef: string, methods: OnlineMethod[]): Promise<boolean> {
    const payment = await this.prisma.payment.findUnique({ where: { providerRef }, select: { orderId: true, method: true } });
    if (!payment || !methods.includes(payment.method as OnlineMethod)) return false;
    return this.cancelUnpaid(payment.orderId, 'FAILED');
  }

  /** Cancela as encomendas online cujo prazo de pagamento já passou. */
  async cancelExpired(now = new Date()): Promise<number> {
    const pending = await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        method: { in: ONLINE_PAYMENT_METHODS },
        providerRef: { not: null }, // MB WAY manual (sem IfthenPay) não expira sozinho
        order: { status: 'AWAITING_PAYMENT' },
      },
      select: { orderId: true, method: true, createdAt: true, expiresAt: true },
    });

    let cancelled = 0;
    for (const p of pending) {
      if (paymentDeadline(p.method as OnlineMethod, p.createdAt, p.expiresAt) > now) continue;
      if (await this.cancelUnpaid(p.orderId, 'EXPIRED')) cancelled++;
    }
    if (cancelled > 0) this.logger.log(`[Pagamentos] ${cancelled} encomenda(s) cancelada(s) por falta de pagamento`);
    return cancelled;
  }

  /** Cartão e Apple Pay: sessão na página da IfthenPay, que no fim volta à confirmação. */
  private async startGateway(
    orderId: string, orderRef: string, amount: number, description: string, method: OnlineMethod, lang: 'pt' | 'en',
  ): Promise<PaymentAction> {
    const config = this.ifthenpay.config;
    const frontendUrl = (process.env.FRONTEND_URL ?? 'https://reaxone.com').replace(/\/+$/, '');
    const confirmationPath = lang === 'en' ? '/en/checkout/confirmation' : '/pt/checkout/confirmacao';
    const methodParam = GATEWAY_RETURN_PARAM[method] ?? 'card';
    const accounts: Record<string, string> = {
      CARD: config.cardAccount, APPLE_PAY: config.applePayAccount, GOOGLE_PAY: config.googlePayAccount,
    };

    const { redirectUrl } = await this.ifthenpay.createGatewaySession({
      orderRef,
      amount,
      description,
      account: accounts[method],
      lang,
      returnUrl: (result) =>
        `${frontendUrl}${confirmationPath}?order=${encodeURIComponent(orderId)}&method=${methodParam}&result=${result}`,
    });
    return { type: 'redirect', url: redirectUrl };
  }

  private savePayment(orderId: string, data: { providerRef?: string; requestId?: string; entity?: string; reference?: string; expiresAt?: Date | null }) {
    return this.prisma.payment.update({ where: { orderId }, data });
  }
}
