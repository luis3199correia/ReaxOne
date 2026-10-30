import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchService } from '../batch/batch.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { detectZone, shippingPrice } from './shipping-rates';

const MAX_QUANTITY_PER_ITEM = 100;

function roundCents(value: number) {
  return Math.round(value * 100) / 100;
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
    paymentMethod: 'MBWAY' | 'BANK_TRANSFER';
    shippingMethod?: string;
    // price, name e shippingCost podem vir no body mas são ignorados — recalculados no servidor
    items: Array<{
      productId: string;
      quantity: number;
      size?: string;
    }>;
  }) {
    const { items, itemsTotal } = await this.priceItems(data.items);
    const isAllDigital = items.every((i) => i.isEbook);
    const country = data.country ?? 'PT';

    let shippingCost = 0;
    if (!isAllDigital) {
      const { freeShippingThreshold } = await this.settingsService.getPublicSettings();
      const zone = detectZone(country, data.postalCode);
      const price = shippingPrice(zone, data.shippingMethod, itemsTotal, freeShippingThreshold);
      if (price === null) {
        throw new BadRequestException('Método de envio indisponível para esta morada.');
      }
      shippingCost = price;
    }
    const shippingMethod = isAllDigital ? 'digital' : data.shippingMethod;
    const totalAmount = roundCents(itemsTotal + shippingCost);

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.isEbook) continue;

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
          totalAmount,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              name:      item.name,
              price:     item.price,
              quantity:  item.quantity,
              size:      item.size,
            })),
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

    // Criar encomenda na Batch em background — apenas para produtos físicos
    if (process.env.BATCH_DISABLED !== 'true') {
      this.fireAndForget(() => this.createBatchOrder(order), '[Batch] Erro ao criar encomenda');
    }

    return order;
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
      cart[key] = item.quantity;
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
