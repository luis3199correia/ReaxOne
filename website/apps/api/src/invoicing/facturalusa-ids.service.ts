import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FacturalusaClient } from './facturalusa.client';
import { InvoicingSettingsService } from './invoicing-settings.service';
import {
  CustomerSpec, GENERIC_VAT_NUMBER, InvoiceOrder, articleReference, buildCustomerPayload,
  genericCustomerPayload, productArticlePayload,
} from './invoice-rules';

export interface InvoiceProduct {
  id: string;
  slug: string;
  name: string;
  facturalusaItemId: number | null;
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
    const id = found ?? await this.client.createItem(productArticlePayload(product));
    if (!found) this.logger.log(`[Faturação] Artigo "${product.slug}" criado no Facturalusa`);
    await this.prisma.product.update({ where: { id: product.id }, data: { facturalusaItemId: id } });
    return id;
  }
}
