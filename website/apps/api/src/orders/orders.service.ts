import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchService } from '../batch/batch.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private batchService: BatchService,
  ) {}

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
    shippingCost?: number;
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      size?: string;
    }>;
  }) {
    const itemsTotal = data.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingCost = data.shippingCost ?? 0;
    const totalAmount = itemsTotal + shippingCost;

    const order = await this.prisma.order.create({
      data: {
        userId:        data.userId,
        email:         data.email,
        firstName:     data.firstName,
        lastName:      data.lastName,
        phone:         data.phone,
        street:        data.street,
        city:          data.city,
        postalCode:    data.postalCode,
        country:       data.country ?? 'PT',
        wantsInvoice:  data.wantsInvoice ?? false,
        nif:           data.nif,
        companyName:   data.companyName,
        shippingMethod: data.shippingMethod,
        shippingCost,
        totalAmount,
        items: {
          create: data.items.map((item) => ({
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

    // Cria encomenda na Batch em background (não bloqueia a resposta)
    this.createBatchOrder(order).catch(() => {});

    return order;
  }

  private async createBatchOrder(order: any) {
    const cart: Record<string, number> = {};
    for (const item of order.items) {
      const key = item.size ? `${item.name} // ${item.size}` : item.name;
      cart[key] = item.quantity;
    }

    const weightGrams = order.items.reduce(
      (acc: number, i: any) => acc + i.quantity * 300, // ~300g por unidade
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
      volumes:     order.items.reduce((acc: number, i: any) => acc + i.quantity, 0),
      total:       order.totalAmount,
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
      include: { items: true, payment: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where:   { id },
      include: { items: true, payment: true, user: true },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    return order;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data:  { status: status as any },
    });
  }

  async confirmPayment(orderId: string) {
    return this.prisma.$transaction([
      this.prisma.payment.update({
        where: { orderId },
        data:  { status: 'CONFIRMED', confirmedAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data:  { status: 'PAID' },
      }),
    ]);
  }
}
