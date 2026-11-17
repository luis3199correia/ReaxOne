import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { isEbookProduct, isFreeEbook } from './free-ebook';

/**
 * Versão pública do produto: nunca expõe o caminho do ficheiro do ebook
 * (seria um download grátis). Indica apenas se é ebook.
 */
function toPublic<T extends {
  price: number;
  ebookFile?: string | null;
  downloadUrl?: string | null;
  downloadUrlEn?: string | null;
  category?: { slug: string } | null;
}>(product: T) {
  const { ebookFile, downloadUrl, downloadUrlEn, ...rest } = product;
  const free = isFreeEbook(product);
  // Os links de download só são públicos quando o ebook é gratuito
  const links = free ? { downloadUrl: downloadUrl ?? null, downloadUrlEn: downloadUrlEn ?? null } : {};
  return { ...rest, ...links, isEbook: isEbookProduct(product), isFreeEbook: free };
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Pública — produtos ativos, sem ebookFile
  async findAllPublic(featured?: boolean) {
    const products = await this.findAll(true, featured);
    return products.map(toPublic);
  }

  // Pública — produto por slug, sem ebookFile
  async findBySlugPublic(slug: string) {
    return toPublic(await this.findBySlug(slug));
  }

  async findAll(active = true, featured?: boolean) {
    return this.prisma.product.findMany({
      where: {
        ...(active ? { active: true } : {}),
        ...(featured !== undefined ? { featured } : {}),
      },
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

  async update(id: string, data: UpdateProductDto) {
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
