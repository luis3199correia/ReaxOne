import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseFacturalusaCategoryId } from './categories.rules';

interface CategoryInput {
  name?: string;
  nameEn?: string | null;
  slug?: string;
  visible?: boolean;
  facturalusaCategoryId?: unknown;
}

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

  async create(data: { name: string; nameEn?: string; slug: string; facturalusaCategoryId?: unknown }) {
    const { facturalusaCategoryId, ...rest } = data;
    return this.prisma.category.create({
      data: { ...rest, facturalusaCategoryId: parseFacturalusaCategoryId(facturalusaCategoryId) ?? null },
    });
  }

  async update(id: string, data: CategoryInput) {
    const { facturalusaCategoryId, ...rest } = data;
    const parsedFacturalusaId = parseFacturalusaCategoryId(facturalusaCategoryId);
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.category.update({
      where: { id },
      data: { ...rest, ...(parsedFacturalusaId !== undefined ? { facturalusaCategoryId: parsedFacturalusaId } : {}) },
    });
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
