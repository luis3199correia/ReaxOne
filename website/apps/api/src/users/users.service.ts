import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        address: true,
      },
    });
  }

  async create(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    // Escolher explicitamente os campos editáveis — o body chega sem validação e
    // não pode alterar role, email ou password.
    const { firstName, lastName, phone } = data ?? {};
    return this.prisma.user.update({ where: { id }, data: { firstName, lastName, phone } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
