import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Configuração da faturação, guardada na tabela Settings. Nunca passa pelo
 * GET /settings/public — só pelos endpoints de admin em /invoicing/settings.
 */
const KEYS = {
  enabled:           'invoicing_enabled',
  draft:             'invoicing_draft',
  series:            'invoicing_series',
  enabledAt:         'invoicing_enabled_at',      // só se faturam pagamentos a partir daqui
  genericCustomerId: 'facturalusa_generic_customer_id',
  shippingItemId:    'facturalusa_shipping_item_id',
} as const;

const SERIES_MAX_LENGTH = 30;

export interface InvoicingSettings {
  enabled: boolean;
  draft: boolean;   // emitir como Rascunho (por omissão) ou Terminado
  series: string;   // '' = série por omissão do Facturalusa
  enabledAt: Date | null;
}

export type CachedIdKey = 'genericCustomerId' | 'shippingItemId';

@Injectable()
export class InvoicingSettingsService {
  constructor(private prisma: PrismaService) {}

  async get(): Promise<InvoicingSettings> {
    const rows = await this.prisma.settings.findMany({
      where: { key: { in: [KEYS.enabled, KEYS.draft, KEYS.series, KEYS.enabledAt] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const enabledAt = map.get(KEYS.enabledAt);
    return {
      enabled:   map.get(KEYS.enabled) === 'true',
      draft:     map.has(KEYS.draft) ? map.get(KEYS.draft) === 'true' : true,
      series:    map.get(KEYS.series) ?? '',
      enabledAt: enabledAt && !Number.isNaN(Date.parse(enabledAt)) ? new Date(enabledAt) : null,
    };
  }

  async update(dto: { enabled?: unknown; draft?: unknown; series?: unknown }): Promise<InvoicingSettings> {
    const current = await this.get();
    const entries: Array<[string, string]> = [];
    if (dto.enabled !== undefined) {
      if (typeof dto.enabled !== 'boolean') throw new BadRequestException('Valor inválido para ativar a faturação.');
      entries.push([KEYS.enabled, String(dto.enabled)]);
      // Ao ligar, guarda o instante: encomendas pagas antes disto nunca são faturadas automaticamente
      if (dto.enabled && !current.enabled) entries.push([KEYS.enabledAt, new Date().toISOString()]);
    }
    if (dto.draft !== undefined) {
      if (typeof dto.draft !== 'boolean') throw new BadRequestException('Valor inválido para emitir como rascunho.');
      entries.push([KEYS.draft, String(dto.draft)]);
    }
    if (dto.series !== undefined) {
      if (typeof dto.series !== 'string') throw new BadRequestException('Série inválida.');
      const series = dto.series.trim();
      if (series.length > SERIES_MAX_LENGTH) {
        throw new BadRequestException(`A série não pode ter mais de ${SERIES_MAX_LENGTH} caracteres.`);
      }
      entries.push([KEYS.series, series]);
    }
    await Promise.all(entries.map(([key, value]) => this.save(key, value)));
    return this.get();
  }

  /** IDs do Facturalusa guardados para não repetir pesquisas na API. */
  async getCachedId(key: CachedIdKey): Promise<number | null> {
    const row = await this.prisma.settings.findUnique({ where: { key: KEYS[key] } });
    const id = Number(row?.value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  async setCachedId(key: CachedIdKey, id: number): Promise<void> {
    await this.save(KEYS[key], String(id));
  }

  private save(key: string, value: string) {
    return this.prisma.settings.upsert({
      where:  { key },
      update: { value },
      create: { id: key, key, value },
    });
  }
}
