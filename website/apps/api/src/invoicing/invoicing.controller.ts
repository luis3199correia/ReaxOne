import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { InvoicingService } from './invoicing.service';
import { InvoicingSettingsService } from './invoicing-settings.service';
import { ProductSyncService } from './product-sync.service';

/** Backoffice: configuração da faturação (Facturalusa). Nunca exposta no /settings/public. */
@Controller('invoicing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicingController {
  constructor(
    private invoicing: InvoicingService,
    private settings: InvoicingSettingsService,
    private productSync: ProductSyncService,
  ) {}

  @Get('settings')
  async getSettings() {
    return this.view(await this.settings.get());
  }

  @Patch('settings')
  async updateSettings(@Body() body: { enabled?: unknown; draft?: unknown; series?: unknown }) {
    return this.view(await this.settings.update(body ?? {}));
  }

  /** Cria/atualiza no Facturalusa os artigos de todos os produtos (1–2 pedidos por produto). */
  @Post('sync-products')
  @HttpCode(200)
  syncProducts() {
    return this.productSync.syncProducts();
  }

  private view(s: { enabled: boolean; draft: boolean; series: string }) {
    return { enabled: s.enabled, draft: s.draft, series: s.series, keyConfigured: this.invoicing.keyConfigured };
  }
}
