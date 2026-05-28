import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Todas as categorias (admin)
  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // Apenas categorias visíveis (loja pública)
  findVisible() {
    return this.prisma.category.findMany({
      where: { visible: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; slug: string }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: { name?: string; slug?: string; visible?: boolean }) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    // Só apaga se não tiver produtos
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    if ((cat as any)._count.products > 0) {
      throw new Error('Não podes apagar uma categoria com produtos associados.');
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
