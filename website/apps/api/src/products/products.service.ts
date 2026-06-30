import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  price: number;
  images?: string[];
  stock?: number;
  categoryId?: string;
  ebookFile?: string; // caminho para o PDF (apenas para ebooks)
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
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error: any) {
      // P2003 = foreign key constraint (produto tem encomendas associadas)
      if (error?.code === 'P2003' || error?.code === 'P2014') {
        throw new ConflictException(
          'Este produto tem encomendas associadas e não pode ser apagado. Desativa-o em vez disso.',
        );
      }
      throw error;
    }
  }
}
