import {
  BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FacturalusaClient, FacturalusaSale } from './facturalusa.client';
import { FacturalusaIdsService } from './facturalusa-ids.service';
import { InvoicingSettings, InvoicingSettingsService } from './invoicing-settings.service';
import {
  InvoiceOrder, buildSalePayload, invoiceBlocker, invoiceStatusFromSale, lisbonDate, selectCustomer, totalMismatchNote,
} from './invoice-rules';

const MAX_ATTEMPTS = 5;
const RETRY_SWEEP_INTERVAL_MS = 15 * 60_000;
const RETRY_MIN_AGE_MS = 2 * 60_000; // dá tempo à emissão logo após o pagamento
const RETRY_BATCH_SIZE = 20;
const ERROR_MAX_LENGTH = 500;

const ORDER_INCLUDE = {
  items: { include: { product: { select: { id: true, slug: true, name: true, facturalusaItemId: true } } } },
} as const;

/** Campos da fatura devolvidos ao backoffice. */
export const INVOICE_FIELDS = {
  id: true, invoiceId: true, invoiceNumber: true, invoiceUrl: true, invoiceStatus: true,
  invoiceError: true, invoiceAttempts: true, invoicedAt: true,
} as const;

function errorMessage(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  return message.slice(0, ERROR_MAX_LENGTH);
}

/**
 * Emissão automática de faturas certificadas no Facturalusa: logo após o
 * pagamento (OrdersService.afterPaid) e, se falhar, num varrimento periódico.
 */
@Injectable()
export class InvoicingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InvoicingService.name);
  private sweepTimer: NodeJS.Timeout | null = null;
  private readonly inFlight = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private client: FacturalusaClient,
    private ids: FacturalusaIdsService,
    private settings: InvoicingSettingsService,
  ) {}

  onModuleInit() {
    this.sweepTimer = setInterval(() => {
      this.retryPending().catch((e) => this.logger.error('[Faturação] Erro no varrimento de faturas pendentes', e));
    }, RETRY_SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  get keyConfigured(): boolean {
    return this.client.isConfigured;
  }

  /** Chamado depois de a encomenda ficar paga. Não faz nada com a faturação desligada. */
  async issueForOrder(orderId: string): Promise<void> {
    const settings = await this.settings.get();
    if (!settings.enabled || !this.client.isConfigured) return;
    await this.issue(orderId, settings);
  }

  /** Backoffice: emitir ou tentar de novo (repõe as tentativas). */
  async issueManually(orderId: string) {
    const settings = await this.settings.get();
    if (!this.client.isConfigured) throw new BadRequestException('A API key do Facturalusa não está configurada.');
    if (!settings.enabled) throw new BadRequestException('A faturação está desligada nas configurações.');
    const order = await this.prisma.order.findUnique({
      where:  { id: orderId },
      select: { status: true, invoiceStatus: true, payment: { select: { status: true } } },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    if (order.status === 'CANCELLED') throw new BadRequestException('A encomenda está cancelada.');
    if (order.payment?.status !== 'CONFIRMED') throw new BadRequestException('O pagamento ainda não está confirmado.');
    if (order.invoiceStatus === 'ISSUED' || order.invoiceStatus === 'DRAFT') {
      throw new BadRequestException('Esta encomenda já tem fatura.');
    }
    await this.prisma.order.update({ where: { id: orderId }, data: { invoiceAttempts: 0 } });
    await this.issue(orderId, settings);
    return this.prisma.order.findUnique({ where: { id: orderId }, select: INVOICE_FIELDS });
  }

  /** Volta a tentar as faturas falhadas ou em falta de pagamentos feitos com a faturação ligada. */
  private async retryPending() {
    const settings = await this.settings.get();
    if (!settings.enabled || !settings.enabledAt || !this.client.isConfigured) return;
    const orders = await this.prisma.order.findMany({
      where: {
        status:          { not: 'CANCELLED' },
        OR:              [{ invoiceStatus: null }, { invoiceStatus: 'FAILED' }],
        invoiceAttempts: { lt: MAX_ATTEMPTS },
        payment: {
          is: { status: 'CONFIRMED', confirmedAt: { gte: settings.enabledAt, lte: new Date(Date.now() - RETRY_MIN_AGE_MS) } },
        },
      },
      select:  { id: true },
      orderBy: { createdAt: 'asc' },
      take:    RETRY_BATCH_SIZE,
    });
    for (const { id } of orders) await this.issue(id, settings);
  }

  private async issue(orderId: string, settings: InvoicingSettings) {
    if (this.inFlight.has(orderId)) return;
    this.inFlight.add(orderId);
    try {
      await this.issueOnce(orderId, settings);
    } catch (e) {
      await this.markFailed(orderId, errorMessage(e));
    } finally {
      this.inFlight.delete(orderId);
    }
  }

  private async issueOnce(orderId: string, settings: InvoicingSettings) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    if (!order || order.invoiceStatus === 'ISSUED' || order.invoiceStatus === 'DRAFT') return;

    const invoiceOrder = toInvoiceOrder(order);
    const blocker = invoiceBlocker(invoiceOrder);
    if (blocker) throw new Error(blocker);

    const customerId = await this.ids.customerFor(selectCustomer(invoiceOrder), invoiceOrder);
    const articleIds = await this.ids.articlesFor(order.items.map((i) => i.product));
    const shippingArticleId = invoiceOrder.shippingCost > 0 ? await this.ids.shippingArticle() : null;
    const payload = buildSalePayload({
      order: invoiceOrder, customerId, articleIds, shippingArticleId, settings, issueDate: lisbonDate(new Date()),
    });

    const sale = await this.client.createSale(payload);
    const status = invoiceStatusFromSale(sale.status);
    const notes = [
      saleTotalNote(sale, order.totalAmount),
      sale.at_success === false && sale.at_message ? `Comunicação à AT: ${sale.at_message}` : null,
      status === 'ISSUED' ? await this.sendEmail(sale.id, order) : null,
    ].filter((n): n is string => n !== null);
    if (notes.length > 0) this.logger.warn(`[Faturação] Encomenda ${orderId}: ${notes.join(' ')}`);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceId:     sale.id,
        invoiceNumber: sale.document_full_number || null,
        invoiceUrl:    sale.url_file || null,
        invoiceStatus: status,
        invoiceError:  notes.length > 0 ? notes.join(' ').slice(0, ERROR_MAX_LENGTH) : null,
        invoicedAt:    new Date(),
      },
    });
    this.logger.log(`[Faturação] Encomenda ${orderId}: ${status === 'DRAFT' ? 'rascunho criado' : `fatura ${sale.document_full_number} emitida`}`);
  }

  /** O Facturalusa envia o documento ao comprador; uma falha aqui não invalida a fatura. */
  private async sendEmail(saleId: number, order: { email: string; firstName: string; lastName: string }): Promise<string | null> {
    try {
      await this.client.sendSaleEmail(saleId, { name: `${order.firstName} ${order.lastName}`.trim(), email: order.email });
      return null;
    } catch (e) {
      return `Fatura emitida, mas o envio por email falhou: ${errorMessage(e)}`;
    }
  }

  private async markFailed(orderId: string, message: string) {
    this.logger.error(`[Faturação] Encomenda ${orderId}: falhou a emissão — ${message}`);
    await this.prisma.order.update({
      where: { id: orderId },
      data:  { invoiceStatus: 'FAILED', invoiceError: message, invoiceAttempts: { increment: 1 } },
    }).catch((e) => this.logger.error(`[Faturação] Erro ao registar a falha da encomenda ${orderId}`, e));
  }
}

function saleTotalNote(sale: FacturalusaSale, orderTotal: number): string | null {
  const total = Number(sale.grand_total);
  if (sale.grand_total === null || sale.grand_total === undefined || !Number.isFinite(total)) return null;
  return totalMismatchNote(total, orderTotal);
}

function toInvoiceOrder(order: any): InvoiceOrder {
  return {
    id:             order.id,
    totalAmount:    order.totalAmount,
    email:          order.email,
    firstName:      order.firstName,
    lastName:       order.lastName,
    street:         order.street,
    city:           order.city,
    postalCode:     order.postalCode,
    country:        order.country,
    wantsInvoice:   order.wantsInvoice,
    nif:            order.nif,
    companyName:    order.companyName,
    shippingCost:   order.shippingCost,
    discountAmount: order.discountAmount,
    items: order.items.map((i: any) => ({
      productId: i.productId,
      name:      i.name,
      price:     i.price,
      quantity:  i.quantity,
      size:      i.size ?? null,
      isGift:    i.isGift,
    })),
  };
}
