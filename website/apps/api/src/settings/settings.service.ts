import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  contactEmail: string;
  iban: string;
  ibanHolder: string;
}

const KEYS = {
  whatsappNumber: 'whatsapp_number',
  whatsappEnabled: 'whatsapp_enabled',
  contactEmail: 'contact_email',
  iban: 'iban',
  ibanHolder: 'iban_holder',
} as const;

const DEFAULTS: PublicSettings = {
  whatsappNumber: process.env.WHATSAPP_NUMBER ?? '351911084422',
  whatsappEnabled: true,
  contactEmail: process.env.CONTACT_EMAIL ?? 'contatos@reaxone.com',
  iban: process.env.BANK_IBAN ?? '',
  ibanHolder: '',
};

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
    };
  }

  async updateSettings(dto: Partial<PublicSettings>): Promise<PublicSettings> {
    const entries: Array<[string, string]> = [];
    if (dto.whatsappNumber !== undefined) entries.push([KEYS.whatsappNumber, dto.whatsappNumber]);
    if (dto.whatsappEnabled !== undefined) entries.push([KEYS.whatsappEnabled, String(dto.whatsappEnabled)]);
    if (dto.contactEmail !== undefined) entries.push([KEYS.contactEmail, dto.contactEmail]);
    if (dto.iban !== undefined) entries.push([KEYS.iban, dto.iban]);
    if (dto.ibanHolder !== undefined) entries.push([KEYS.ibanHolder, dto.ibanHolder]);

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
