import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isEbookProduct } from '../products/free-ebook';
import { FacturalusaClient } from './facturalusa.client';
import { InvoicingSettingsService } from './invoicing-settings.service';
import {
  CustomerSpec, GENERIC_VAT_NUMBER, InvoiceOrder, SHIPPING_ARTICLE, articleReference, buildCustomerPayload,
  genericCustomerPayload, productArticlePayload, shippingArticlePayload,
} from './invoice-rules';

export interface InvoiceProduct {
  id: string;
  slug: string;
  name: string;
  facturalusaItemId: number | null;
  price?: number;
  ebookFile?: string | null;
  ebookFileEn?: string | null;
  category?: { facturalusaCategoryId: number | null; slug?: string | null } | null;
}

/**
 * Resolve os IDs do Facturalusa (clientes e artigos), criando o que faltar.
 * Os IDs ficam guardados (Product.facturalusaItemId e Settings) para poupar
 * pedidos à API, como pede a documentação.
 */
@Injectable()
export class FacturalusaIdsService {
  private readonly logger = new Logger(FacturalusaIdsService.name);

  constructor(
    private prisma: PrismaService,
    private client: FacturalusaClient,
    private settings: InvoicingSettingsService,
  ) {}

  async customerFor(spec: CustomerSpec, order: InvoiceOrder): Promise<number> {
    if (spec.kind === 'generic') return this.genericCustomer();
    const found = await this.client.findCustomerByVat(spec.vatNumber);
    if (found) return found;
    const id = await this.client.createCustomer(buildCustomerPayload(spec, order));
    this.logger.log(`[Faturação] Cliente criado no Facturalusa (NIF ${spec.vatNumber})`);
    return id;
  }

  /** Mapa productId → ID do artigo no Facturalusa. */
  async articlesFor(products: InvoiceProduct[]): Promise<Record<string, number>> {
    const unique = [...new Map(products.map((p) => [p.id, p])).values()];
    const entries: Array<[string, number]> = [];
    // Em série: evita criar o mesmo artigo duas vezes e rajadas de pedidos
    for (const product of unique) {
      entries.push([product.id, product.facturalusaItemId ?? await this.productArticle(product)]);
    }
    return Object.fromEntries(entries);
  }

  async shippingArticle(): Promise<number> {
    const cached = await this.settings.getCachedId('shippingItemId');
    if (cached) return cached;
    const id = (await this.client.findItemByReference(SHIPPING_ARTICLE.reference))
      ?? await this.client.createItem(shippingArticlePayload());
    await this.settings.setCachedId('shippingItemId', id);
    return id;
  }

  /** Esquece os IDs de artigos guardados, para voltarem a ser procurados/criados. */
  async forgetItemIds(productIds: string[]): Promise<void> {
    await this.settings.clearCachedId('shippingItemId');
    await this.prisma.product.updateMany({ where: { id: { in: productIds } }, data: { facturalusaItemId: null } });
    this.logger.warn('[Faturação] IDs de artigos do Facturalusa inválidos: vão ser procurados de novo');
  }

  private async genericCustomer(): Promise<number> {
    const cached = await this.settings.getCachedId('genericCustomerId');
    if (cached) return cached;
    const id = (await this.client.findCustomerByVat(GENERIC_VAT_NUMBER))
      ?? await this.client.createCustomer(genericCustomerPayload());
    await this.settings.setCachedId('genericCustomerId', id);
    return id;
  }

  private async productArticle(product: InvoiceProduct): Promise<number> {
    const found = await this.client.findItemByReference(articleReference(product.slug));
    const id = found ?? await this.client.createItem(
      productArticlePayload(
        { ...product, facturalusaCategoryId: product.category?.facturalusaCategoryId, isEbook: isEbookProduct(product) },
        await this.settings.getPriceTableId(),
      ),
    );
    if (!found) this.logger.log(`[Faturação] Artigo "${product.slug}" criado no Facturalusa`);
    await this.prisma.product.update({ where: { id: product.id }, data: { facturalusaItemId: id } });
    return id;
  }
}
