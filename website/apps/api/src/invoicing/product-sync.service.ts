import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isEbookProduct } from '../products/free-ebook';
import { FacturalusaClient, FacturalusaError } from './facturalusa.client';
import { isInvalidIdResponse, isNotFoundResponse } from './facturalusa.rules';
import { articleReference, productArticlePayload } from './invoice-rules';
import { InvoicingSettingsService } from './invoicing-settings.service';

const HTTP_TOO_MANY_REQUESTS = 429;
const DUPLICATE_REFERENCE_ERROR = 'Referência igual à de outro produto (slug demasiado longo): encurte o slug.';

interface SyncProduct {
  id: string;
  slug: string;
  name: string;
  facturalusaItemId: number | null;
  price: number;
  ebookFile?: string | null;
  ebookFileEn?: string | null;
  category: { facturalusaCategoryId: number | null; slug?: string | null } | null;
}

type SyncOutcome = 'created' | 'updated';

function isMissingItemError(e: unknown): boolean {
  return e instanceof FacturalusaError
    && (isNotFoundResponse(e.status, e.message) || isInvalidIdResponse(e.status, e.message));
}

/** Referências partilhadas por mais de um produto (o slug é cortado no limite SAF-T). */
function duplicatedReferences(products: SyncProduct[]): Set<string> {
  const counts = new Map<string, number>();
  for (const p of products) {
    const ref = articleReference(p.slug);
    counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([ref]) => ref));
}

export interface ProductSyncResult {
  total: number;
  created: number;
  updated: number;
  failed: Array<{ slug: string; name: string; error: string }>;
  /** Motivo de paragem a meio (ex.: limite diário da API), ou null. */
  stoppedReason: string | null;
}

/**
 * Sincroniza o catálogo da loja com os artigos do Facturalusa (site → Facturalusa).
 * Cria os artigos que faltam e atualiza descrição/IVA/tipo dos existentes.
 * Os preços não vão: a API exige uma tabela de preços e cada linha da fatura
 * já leva o preço praticado.
 */
@Injectable()
export class ProductSyncService {
  private readonly logger = new Logger(ProductSyncService.name);

  constructor(
    private prisma: PrismaService,
    private client: FacturalusaClient,
    private settings: InvoicingSettingsService,
  ) {}

  /** Uma sincronização de cada vez: duas em paralelo podiam criar artigos duplicados. */
  private running = false;

  async syncProducts(): Promise<ProductSyncResult> {
    if (!this.client.isConfigured) throw new BadRequestException('FACTURALUSA_API_KEY não configurada.');
    if (this.running) throw new ConflictException('Já está a decorrer uma sincronização de produtos.');
    this.running = true;
    try {
      return await this.runSync();
    } finally {
      this.running = false;
    }
  }

  private async runSync(): Promise<ProductSyncResult> {
    const products: SyncProduct[] = await this.prisma.product.findMany({
      select: {
        id: true, slug: true, name: true, price: true, facturalusaItemId: true, ebookFile: true, ebookFileEn: true,
        category: { select: { facturalusaCategoryId: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    });
    const priceTableId = await this.settings.getPriceTableId();
    const duplicated = duplicatedReferences(products);
    const result: ProductSyncResult = { total: products.length, created: 0, updated: 0, failed: [], stoppedReason: null };

    // Em série: o Facturalusa tem limite diário de pedidos e não queremos rajadas
    for (const product of products) {
      if (duplicated.has(articleReference(product.slug))) {
        result.failed.push({ slug: product.slug, name: product.name, error: DUPLICATE_REFERENCE_ERROR });
        continue;
      }
      try {
        result[await this.syncOne(product, priceTableId)] += 1;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (e instanceof FacturalusaError && e.status === HTTP_TOO_MANY_REQUESTS) {
          result.stoppedReason = message;
          break;
        }
        result.failed.push({ slug: product.slug, name: product.name, error: message });
      }
    }

    this.logger.log(
      `[Faturação] Sincronização de produtos: ${result.created} criados, ${result.updated} atualizados, ` +
      `${result.failed.length} com erro${result.stoppedReason ? ` — parou: ${result.stoppedReason}` : ''}`,
    );
    return result;
  }

  private async syncOne(product: SyncProduct, priceTableId: number | null): Promise<SyncOutcome> {
    const payload = productArticlePayload(
      { ...product, facturalusaCategoryId: product.category?.facturalusaCategoryId, isEbook: isEbookProduct(product) },
      priceTableId,
    );
    // Na atualização volta a ativar o artigo (a criação é sempre activa e não aceita o campo)
    const updatePayload = { ...payload, active: true };
    const storedId = product.facturalusaItemId;
    if (storedId) {
      try {
        await this.client.updateItem(storedId, updatePayload);
        return 'updated';
      } catch (e) {
        // ID guardado já não existe nesta conta (apagado, ou de outra chave): volta a ligar pela referência
        if (!isMissingItemError(e)) throw e;
      }
    }

    const found = await this.client.findItemByReference(articleReference(product.slug));
    if (found && found === storedId) {
      // O artigo existe com este ID, por isso o problema é a atualização em si
      throw new Error(`O artigo ${found} existe no Facturalusa, mas não aceitou a atualização.`);
    }
    if (found) await this.client.updateItem(found, updatePayload);
    const id = found ?? await this.client.createItem(payload);
    await this.prisma.product.update({ where: { id: product.id }, data: { facturalusaItemId: id } });
    return found ? 'updated' : 'created';
  }
}
