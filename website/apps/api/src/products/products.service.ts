import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  price: number;
  images?: string[];
  stock?: number;
  categoryId?: string;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(active = true) {
    return this.prisma.product.findMany({
      where: active ? { active: true } : {},
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, variants: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: Partial<CreateProductDto> & { active?: boolean }) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }
}
