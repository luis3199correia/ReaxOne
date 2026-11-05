import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  contactEmail: string;
  iban: string;
  ibanHolder: string;
  // Portes grátis a partir destes subtotais; 0 desativa
  freeShippingThreshold: number;   // Portugal Continental
  freeShippingThresholdEs: number; // Espanha (continental, Baleares e Canárias)
  freeShippingThresholdEu: number; // Restantes países da UE
  // Banner no topo do site. Datas em ISO 8601 ('' = sem limite)
  bannerEnabled: boolean;
  bannerMessage: string;
  bannerSubtext: string;
  bannerMessageEn: string; // vazio → usa o texto PT
  bannerSubtextEn: string;
  bannerStartsAt: string;
  bannerEndsAt: string;
}

type BannerTextField = 'bannerMessage' | 'bannerSubtext' | 'bannerMessageEn' | 'bannerSubtextEn';
const BANNER_TEXT_FIELDS: BannerTextField[] = ['bannerMessage', 'bannerSubtext', 'bannerMessageEn', 'bannerSubtextEn'];
const BANNER_TEXT_MAX_LENGTH = 300;

type ThresholdField = 'freeShippingThreshold' | 'freeShippingThresholdEs' | 'freeShippingThresholdEu';
const THRESHOLD_FIELDS: ThresholdField[] = ['freeShippingThreshold', 'freeShippingThresholdEs', 'freeShippingThresholdEu'];

const KEYS = {
  whatsappNumber: 'whatsapp_number',
  whatsappEnabled: 'whatsapp_enabled',
  contactEmail: 'contact_email',
  iban: 'iban',
  ibanHolder: 'iban_holder',
  freeShippingThreshold: 'shipping_free_above',
  freeShippingThresholdEs: 'shipping_free_above_es',
  freeShippingThresholdEu: 'shipping_free_above_eu',
  bannerEnabled: 'banner_enabled',
  bannerMessage: 'banner_message',
  bannerSubtext: 'banner_subtext',
  bannerMessageEn: 'banner_message_en',
  bannerSubtextEn: 'banner_subtext_en',
  bannerStartsAt: 'banner_starts_at',
  bannerEndsAt: 'banner_ends_at',
} as const;

const DEFAULTS: PublicSettings = {
  whatsappNumber: process.env.WHATSAPP_NUMBER ?? '351911084422',
  whatsappEnabled: true,
  contactEmail: process.env.CONTACT_EMAIL ?? 'contatos@reaxone.com',
  iban: process.env.BANK_IBAN ?? '',
  ibanHolder: '',
  freeShippingThreshold: 35,
  freeShippingThresholdEs: 50,
  freeShippingThresholdEu: 70,
  bannerEnabled: false,
  bannerMessage: '',
  bannerSubtext: '',
  bannerMessageEn: '',
  bannerSubtextEn: '',
  bannerStartsAt: '',
  bannerEndsAt: '',
};

// '' limpa a data; qualquer outro valor tem de ser uma data válida (guardada normalizada em ISO)
function normalizeBannerDate(value: unknown): string {
  if (value === null || value === '') return '';
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadRequestException('Data do banner inválida.');
  }
  return new Date(value).toISOString();
}

function parseThreshold(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
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
      freeShippingThreshold: parseThreshold(map.get(KEYS.freeShippingThreshold), DEFAULTS.freeShippingThreshold),
      freeShippingThresholdEs: parseThreshold(map.get(KEYS.freeShippingThresholdEs), DEFAULTS.freeShippingThresholdEs),
      freeShippingThresholdEu: parseThreshold(map.get(KEYS.freeShippingThresholdEu), DEFAULTS.freeShippingThresholdEu),
      bannerEnabled: map.get(KEYS.bannerEnabled) === 'true',
      bannerMessage: map.get(KEYS.bannerMessage) ?? DEFAULTS.bannerMessage,
      bannerSubtext: map.get(KEYS.bannerSubtext) ?? DEFAULTS.bannerSubtext,
      bannerMessageEn: map.get(KEYS.bannerMessageEn) ?? DEFAULTS.bannerMessageEn,
      bannerSubtextEn: map.get(KEYS.bannerSubtextEn) ?? DEFAULTS.bannerSubtextEn,
      bannerStartsAt: map.get(KEYS.bannerStartsAt) ?? DEFAULTS.bannerStartsAt,
      bannerEndsAt: map.get(KEYS.bannerEndsAt) ?? DEFAULTS.bannerEndsAt,
    };
  }

  async updateSettings(dto: Partial<PublicSettings>): Promise<PublicSettings> {
    const entries: Array<[string, string]> = [];
    if (dto.whatsappNumber !== undefined) entries.push([KEYS.whatsappNumber, dto.whatsappNumber]);
    if (dto.whatsappEnabled !== undefined) entries.push([KEYS.whatsappEnabled, String(dto.whatsappEnabled)]);
    if (dto.contactEmail !== undefined) entries.push([KEYS.contactEmail, dto.contactEmail]);
    if (dto.iban !== undefined) entries.push([KEYS.iban, dto.iban]);
    if (dto.ibanHolder !== undefined) entries.push([KEYS.ibanHolder, dto.ibanHolder]);
    for (const field of THRESHOLD_FIELDS) {
      if (dto[field] === undefined) continue;
      const n = Number(dto[field]);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestException('O valor para portes grátis tem de ser um número igual ou superior a 0.');
      }
      entries.push([KEYS[field], String(Math.round(n * 100) / 100)]);
    }
    entries.push(...(await this.bannerEntries(dto)));

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

  private async bannerEntries(dto: Partial<PublicSettings>): Promise<Array<[string, string]>> {
    const entries: Array<[string, string]> = [];
    if (dto.bannerEnabled !== undefined) entries.push([KEYS.bannerEnabled, String(dto.bannerEnabled === true)]);
    for (const field of BANNER_TEXT_FIELDS) {
      const value = dto[field];
      if (value === undefined) continue;
      if (typeof value !== 'string') throw new BadRequestException('Texto do banner inválido.');
      const text = value.trim();
      if (text.length > BANNER_TEXT_MAX_LENGTH) {
        throw new BadRequestException(`O texto do banner não pode ter mais de ${BANNER_TEXT_MAX_LENGTH} caracteres.`);
      }
      entries.push([KEYS[field], text]);
    }

    const startsAt = dto.bannerStartsAt !== undefined ? normalizeBannerDate(dto.bannerStartsAt) : undefined;
    const endsAt = dto.bannerEndsAt !== undefined ? normalizeBannerDate(dto.bannerEndsAt) : undefined;
    if (startsAt !== undefined) entries.push([KEYS.bannerStartsAt, startsAt]);
    if (endsAt !== undefined) entries.push([KEYS.bannerEndsAt, endsAt]);

    if (startsAt !== undefined || endsAt !== undefined) {
      const current = await this.getPublicSettings();
      const start = startsAt ?? current.bannerStartsAt;
      const end = endsAt ?? current.bannerEndsAt;
      if (start && end && Date.parse(end) <= Date.parse(start)) {
        throw new BadRequestException('A data de fim do banner tem de ser posterior à data de início.');
      }
    }

    if (dto.bannerEnabled === true) {
      const message = dto.bannerMessage !== undefined
        ? dto.bannerMessage.trim()
        : (await this.getPublicSettings()).bannerMessage;
      if (!message) throw new BadRequestException('Para ativar o banner é preciso escrever a mensagem.');
    }
    return entries;
  }
}
