import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  contactEmail: string;
  iban: string;
  ibanHolder: string;
  // Portes grátis (Portugal Continental) a partir deste subtotal; 0 desativa
  freeShippingThreshold: number;
}

const KEYS = {
  whatsappNumber: 'whatsapp_number',
  whatsappEnabled: 'whatsapp_enabled',
  contactEmail: 'contact_email',
  iban: 'iban',
  ibanHolder: 'iban_holder',
  freeShippingThreshold: 'shipping_free_above',
} as const;

const DEFAULTS: PublicSettings = {
  whatsappNumber: process.env.WHATSAPP_NUMBER ?? '351911084422',
  whatsappEnabled: true,
  contactEmail: process.env.CONTACT_EMAIL ?? 'contatos@reaxone.com',
  iban: process.env.BANK_IBAN ?? '',
  ibanHolder: '',
  freeShippingThreshold: 35,
};

function parseThreshold(value: string | undefined): number {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) && n >= 0 ? n : DEFAULTS.freeShippingThreshold;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublicSettings(): Promise<PublicSettings> {
    const rows = await this.prisma.settings.findMany({
      where: { key: { in: Object.values(KEYS) } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      whatsappNumber: map.get(KEYS.whatsappNumber) || DEFAULTS.whatsappNumber,
      whatsappEnabled: map.has(KEYS.whatsappEnabled)
        ? map.get(KEYS.whatsappEnabled) === 'true'
        : DEFAULTS.whatsappEnabled,
      contactEmail: map.get(KEYS.contactEmail) || DEFAULTS.contactEmail,
      iban: map.get(KEYS.iban) || DEFAULTS.iban,
      ibanHolder: map.get(KEYS.ibanHolder) || DEFAULTS.ibanHolder,
      freeShippingThreshold: parseThreshold(map.get(KEYS.freeShippingThreshold)),
    };
  }

  async updateSettings(dto: Partial<PublicSettings>): Promise<PublicSettings> {
    const entries: Array<[string, string]> = [];
    if (dto.whatsappNumber !== undefined) entries.push([KEYS.whatsappNumber, dto.whatsappNumber]);
    if (dto.whatsappEnabled !== undefined) entries.push([KEYS.whatsappEnabled, String(dto.whatsappEnabled)]);
    if (dto.contactEmail !== undefined) entries.push([KEYS.contactEmail, dto.contactEmail]);
    if (dto.iban !== undefined) entries.push([KEYS.iban, dto.iban]);
    if (dto.ibanHolder !== undefined) entries.push([KEYS.ibanHolder, dto.ibanHolder]);
    if (dto.freeShippingThreshold !== undefined) {
      const n = Number(dto.freeShippingThreshold);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestException('O valor para portes grátis tem de ser um número igual ou superior a 0.');
      }
      entries.push([KEYS.freeShippingThreshold, String(Math.round(n * 100) / 100)]);
    }

    await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.settings.upsert({
          where: { key },
          update: { value },
          create: { id: key, key, value },
        }),
      ),
    );

    return this.getPublicSettings();
  }
}
