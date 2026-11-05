import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchService } from '../batch/batch.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { DiscountsService } from '../discounts/discounts.service';
import { PromotionsService } from '../promotions/promotions.service';
import { detectZone, shippingPrice } from './shipping-rates';
import { PICKUP_METHOD_ID } from './pickup';

const MAX_QUANTITY_PER_ITEM = 100;
const NOTES_MAX_LENGTH = 500;

const PAYMENT_METHODS = ['MBWAY', 'BANK_TRANSFER', 'CASH'] as const;
type PaymentMethodInput = (typeof PAYMENT_METHODS)[number];

function roundCents(value: number) {
  return Math.round(value * 100) / 100;
}

/** Notas do cliente: opcionais, sem espaços a mais e com tamanho limitado. */
function parseNotes(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new BadRequestException('Notas inválidas.');
  const notes = value.trim();
  if (notes.length > NOTES_MAX_LENGTH) {
    throw new BadRequestException(`As notas não podem ter mais de ${NOTES_MAX_LENGTH} caracteres.`);
  }
  return notes || null;
}

// Campos do cliente que podem ir para o backoffice (nunca a password)
const USER_PUBLIC_FIELDS = { id: true, email: true, firstName: true, lastName: true, phone: true } as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private batchService: BatchService,
    private mailService: MailService,
    private settingsService: SettingsService,
    private discountsService: DiscountsService,
    private promotionsService: PromotionsService,
  ) {}

  /**
   * Corre uma tarefa em background sem nunca deixar o seu erro propagar-se
   * para o pedido em curso — mesmo que a tarefa rejeite a promise ou rebente
   * de forma síncrona (ex.: cliente de email mal configurado).
   */
  private fireAndForget(task: () => Promise<unknown>, errorContext: string) {
    try {
      Promise.resolve(task()).catch((e) => this.logger.error(errorContext, e));
    } catch (e) {
      this.logger.error(errorContext, e);
    }
  }

  async create(data: {
    userId?: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    country?: string;
    wantsInvoice?: boolean;
    nif?: string;
    companyName?: string;
    paymentMethod: PaymentMethodInput;
    shippingMethod?: string;
    discountCode?: string;
    notes?: string;
    // Ofertas escolhidas pelo cliente (cor das meias); validadas no servidor
    gifts?: Array<{ productId: string; quantity: number }>;
    // price, name e shippingCost podem vir no body mas são ignorados — recalculados no servidor
    items: Array<{
      productId: string;
      quantity: number;
      size?: string;
    }>;
  }) {
    const { items, itemsTotal } = await this.priceItems(data.items);
    const notes = parseNotes(data.notes);
    const giftLines = await this.promotionsService.resolveOrderGifts(items, data.gifts);
    const isAllDigital = items.every((i) => i.isEbook);
    const country = data.country ?? 'PT';
    const isPickup = !isAllDigital && data.shippingMethod === PICKUP_METHOD_ID;

    if (!PAYMENT_METHODS.includes(data.paymentMethod)) {
      throw new BadRequestException('Método de pagamento inválido.');
    }
    if (data.paymentMethod === 'CASH' && !isPickup) {
      throw new BadRequestException('O pagamento em mão só está disponível com levantamento da encomenda.');
    }

    // Levantamento não tem portes. Os limites de portes grátis contam o subtotal
    // dos produtos antes do desconto.
    let shippingCost = 0;
    if (!isAllDigital && !isPickup) {
      const settings = await this.settingsService.getPublicSettings();
      const zone = detectZone(country, data.postalCode);
      const price = shippingPrice(zone, data.shippingMethod, itemsTotal, {
        pt: settings.freeShippingThreshold,
        es: settings.freeShippingThresholdEs,
        eu: settings.freeShippingThresholdEu,
      });
      if (price === null) {
        throw new BadRequestException('Método de envio indisponível para esta morada.');
      }
      shippingCost = price;
    }
    const shippingMethod = isAllDigital ? 'digital' : data.shippingMethod;

    const order = await this.prisma.$transaction(async (tx) => {
      // Valida e consome o código na mesma transação do stock: se algo falhar,
      // a utilização do código é revertida.
      const discount = await this.discountsService.redeem(tx, data.discountCode, itemsTotal);
      const discountAmount = discount?.amount ?? 0;
      const totalAmount = roundCents(itemsTotal - discountAmount + shippingCost);

      const stockLines = [...items.filter((i) => !i.isEbook), ...giftLines];
      for (const item of stockLines) {
        // Decremento condicional e atómico: só desconta se ainda houver stock
        // suficiente, evitando vender a mesma unidade a dois clientes em simultâneo.
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data:  { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(`Sem stock suficiente para "${item.name}".`);
        }
      }

      return tx.order.create({
        data: {
          userId:        data.userId,
          email:         data.email,
          firstName:     data.firstName,
          lastName:      data.lastName,
          phone:         data.phone,
          street:        data.street,
          city:          data.city,
          postalCode:    data.postalCode,
          country,
          wantsInvoice:  data.wantsInvoice ?? false,
          nif:           data.nif,
          companyName:   data.companyName,
          shippingMethod,
          shippingCost,
          discountCode:   discount?.code ?? null,
          discountAmount,
          totalAmount,
          notes,
          items: {
            create: [
              ...items.map((item) => ({
                productId: item.productId,
                name:      item.name,
                price:     item.price,
                quantity:  item.quantity,
                size:      item.size,
              })),
              ...giftLines.map((gift) => ({
                productId: gift.productId,
                name:      gift.name,
                price:     0,
                quantity:  gift.quantity,
                isGift:    true,
              })),
            ],
          },
          payment: {
            create: {
              method: data.paymentMethod,
              status: 'PENDING',
            },
          },
        },
        include: { items: true, payment: true },
      });
    });

    // Confirmar encomenda ao cliente em background
    this.fireAndForget(
      () => this.mailService.sendOrderConfirmation({
        id:            order.id,
        firstName:     order.firstName,
        email:         order.email,
        totalAmount:   order.totalAmount,
        paymentMethod: data.paymentMethod,
        discountCode:   order.discountCode,
        discountAmount: order.discountAmount,
        notes:          order.notes,
        shippingMethod,
        street:        order.street,
        city:          order.city,
        postalCode:    order.postalCode,
        country:       order.country,
        wantsInvoice:  order.wantsInvoice,
        nif:           order.nif,
        companyName:   order.companyName,
        items:         order.items,
      }),
      '[Mail] Erro ao enviar confirmação ao cliente',
    );

    // Notificar admin por email em background
    this.fireAndForget(
      () => this.mailService.sendNewOrderNotification({
        id:             order.id,
        firstName:      order.firstName,
        lastName:       order.lastName,
        email:          order.email,
        phone:          order.phone,
        totalAmount:    order.totalAmount,
        paymentMethod:  data.paymentMethod,
        discountCode:   order.discountCode,
        discountAmount: order.discountAmount,
        notes:          order.notes,
        shippingMethod,
        street:         order.street,
        city:           order.city,
        postalCode:     order.postalCode,
        country:        order.country,
        wantsInvoice:   order.wantsInvoice,
        nif:            order.nif,
        companyName:    order.companyName,
        items:          order.items,
      }),
      '[Mail] Erro ao notificar admin de nova encomenda',
    );

    // Avisar o admin dos produtos que esgotaram com esta encomenda
    const physicalIds = [...new Set([...items.filter((i) => !i.isEbook), ...giftLines].map((i) => i.productId))];
    if (physicalIds.length > 0) {
      this.fireAndForget(() => this.notifySoldOut(physicalIds), '[Mail] Erro ao avisar produtos esgotados');
    }

    // Criar encomenda na Batch em background — apenas para produtos físicos enviados
    // por transportadora (o levantamento é entregue em mão)
    if (process.env.BATCH_DISABLED !== 'true' && !isPickup) {
      this.fireAndForget(() => this.createBatchOrder(order), '[Batch] Erro ao criar encomenda');
    }

    return order;
  }

  /**
   * O decremento de stock é condicional (stock >= quantidade), por isso só a
   * encomenda que leva a última unidade vê o stock a 0 — o aviso sai uma vez.
   */
  private async notifySoldOut(productIds: string[]) {
    const soldOut = await this.prisma.product.findMany({
      where:  { id: { in: productIds }, stock: { lte: 0 } },
      select: { id: true, name: true },
    });
    if (soldOut.length > 0) await this.mailService.sendOutOfStockNotification(soldOut);
  }

  /**
   * Preço, nome e tipo de cada linha vêm da base de dados — do browser só se
   * aproveitam o produto, a quantidade e o tamanho.
   */
  private async priceItems(rawItems: Array<{ productId: string; quantity: number; size?: string }>) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestException('A encomenda não tem produtos.');
    }
    for (const i of rawItems) {
      if (!Number.isInteger(i?.quantity) || i.quantity < 1 || i.quantity > MAX_QUANTITY_PER_ITEM) {
        throw new BadRequestException('Quantidade inválida.');
      }
    }

    const products = await this.prisma.product.findMany({
      where:  { id: { in: rawItems.map((i) => i.productId) }, active: true },
      select: { id: true, name: true, price: true, ebookFile: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = rawItems.map((i) => {
      const product = byId.get(i.productId);
      if (!product) throw new BadRequestException('Um dos produtos já não está disponível.');
      return {
        productId: product.id,
        name:      product.name,
        price:     product.price,
        quantity:  i.quantity,
        size:      typeof i.size === 'string' ? i.size : undefined,
        isEbook:   !!product.ebookFile,
      };
    });
    const itemsTotal = roundCents(items.reduce((acc, i) => acc + i.price * i.quantity, 0));
    return { items, itemsTotal };
  }

  private async createBatchOrder(order: any) {
    // Buscar os produtos para verificar quais são ebooks (digitais)
    const productIds: string[] = order.items.map((i: any) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, ebookFile: true },
    });
    const ebookIds = new Set(
      products.filter((p) => p.ebookFile).map((p) => p.id),
    );

    // Filtrar apenas os itens físicos para a Batch
    const physicalItems = order.items.filter(
      (i: any) => !ebookIds.has(i.productId),
    );

    // Se todos os itens são ebooks, não há envio físico
    if (physicalItems.length === 0) return;

    const cart: Record<string, number> = {};
    for (const item of physicalItems) {
      const key = item.size ? `${item.name} // ${item.size}` : item.name;
      // A mesma meia pode vir comprada e de oferta — soma as quantidades
      cart[key] = (cart[key] ?? 0) + item.quantity;
    }

    const weightGrams = physicalItems.reduce(
      (acc: number, i: any) => acc + i.quantity * 300,
      0
    );

    const batchOrderNumber = await this.batchService.createOrder({
      phone:       order.phone,
      email:       order.email,
      clientname:  `${order.firstName} ${order.lastName}`,
      address:     order.street,
      zipcode:     order.postalCode,
      city:        order.city,
      country:     'Portugal',
      external_id: order.id,
      weight:      weightGrams,
      volumes:     physicalItems.reduce((acc: number, i: any) => acc + i.quantity, 0),
      total:       order.totalAmount,
      platform:    order.shippingMethod || undefined,
      obs:         order.notes || undefined,
      cart,
    });

    if (batchOrderNumber) {
      await this.prisma.order.update({
        where: { id: order.id },
        data:  { batchOrderNumber },
      });
    }
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where:   { userId },
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: true, payment: true, user: { select: USER_PUBLIC_FIELDS } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id },
      include: { items: true, payment: true, user: { select: USER_PUBLIC_FIELDS } },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data:  { status: status as any },
    });

    // Notificar cliente por email em background
    this.fireAndForget(
      () => this.mailService.sendOrderStatusUpdate({
        id:          order.id,
        firstName:   order.firstName,
        email:       order.email,
        status,
        totalAmount: order.totalAmount,
      }),
      '[Mail] Erro ao notificar cliente de mudança de estado',
    );

    return order;
  }

  async remove(id: string) {
    await this.prisma.$transaction([
      this.prisma.payment.deleteMany({ where: { orderId: id } }),
      this.prisma.orderItem.deleteMany({ where: { orderId: id } }),
      this.prisma.order.delete({ where: { id } }),
    ]);
    return { id };
  }

  async removeMany(ids: string[]) {
    await this.prisma.$transaction([
      this.prisma.payment.deleteMany({ where: { orderId: { in: ids } } }),
      this.prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } }),
      this.prisma.order.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return { ids };
  }

  async updateManyStatus(ids: string[], status: string) {
    return Promise.all(ids.map((id) => this.updateStatus(id, status)));
  }

  async confirmPayment(orderId: string) {
    const [payment, order] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { orderId },
        data:  { status: 'CONFIRMED', confirmedAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data:  { status: 'PAID' },
        include: { items: true, payment: true },
      }),
    ]);

    // Enviar email de pagamento confirmado com detalhes da encomenda
    this.fireAndForget(
      () => this.mailService.sendPaymentConfirmed({
        id:            order.id,
        firstName:     order.firstName,
        email:         order.email,
        totalAmount:   order.totalAmount,
        street:        order.street,
        city:          order.city,
        postalCode:    order.postalCode,
        country:       order.country,
        shippingMethod: order.shippingMethod,
        items:         (order as any).items ?? [],
      }),
      '[Mail] Erro ao enviar confirmação de pagamento',
    );

    // Enviar ebooks por email em background (não bloqueia a resposta)
    this.fireAndForget(
      () => this.deliverEbooks(orderId, order.email, order.firstName),
      '[Mail] Erro ao entregar ebooks',
    );

    return [payment, order];
  }

  private async deliverEbooks(
    orderId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    // Buscar itens da encomenda com os respetivos produtos
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: {
        product: {
          select: { id: true, name: true, ebookFile: true },
        },
      },
    });

    // Filtrar itens que têm ficheiro de ebook
    const ebookItems = items.filter((i) => i.product?.ebookFile);
    if (ebookItems.length === 0) return;

    const ebooks = ebookItems.map((i) => ({
      title:    i.product.name,
      filePath: i.product.ebookFile as string,
    }));

    await this.mailService.sendEbookDelivery(email, firstName, orderId, ebooks);
  }
}
