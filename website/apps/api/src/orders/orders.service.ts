import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      size?: string;
    }>;
  }) {
    const totalAmount = data.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country ?? 'PT',
        wantsInvoice: data.wantsInvoice ?? false,
        nif: data.nif,
        companyName: data.companyName,
        totalAmount,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          })),
        },
        payment: {
          create: {
            method: data.paymentMethod,
            status: 'PENDING',
          },
        },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    return order;
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, user: true },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    return order;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async confirmPayment(orderId: string) {
    return this.prisma.$transaction([
      this.prisma.payment.update({
        where: { orderId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      }),
    ]);
  }
}
