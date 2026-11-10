import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { InvoicingService } from './invoicing.service';
import { InvoicingSettingsService } from './invoicing-settings.service';

/** Backoffice: configuração da faturação (Facturalusa). Nunca exposta no /settings/public. */
@Controller('invoicing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicingController {
  constructor(
    private invoicing: InvoicingService,
    private settings: InvoicingSettingsService,
  ) {}

  @Get('settings')
  async getSettings() {
    return this.view(await this.settings.get());
  }

  @Patch('settings')
  async updateSettings(@Body() body: { enabled?: unknown; draft?: unknown; series?: unknown }) {
    return this.view(await this.settings.update(body ?? {}));
  }

  private view(s: { enabled: boolean; draft: boolean; series: string }) {
    return { enabled: s.enabled, draft: s.draft, series: s.series, keyConfigured: this.invoicing.keyConfigured };
  }
}
