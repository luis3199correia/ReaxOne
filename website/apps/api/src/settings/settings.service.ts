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
  // Período dos portes grátis em ISO 8601 ('' = sem limite)
  freeShippingStartsAt: string;
  freeShippingEndsAt: string;
  // Banner no topo do site. Datas em ISO 8601 ('' = sem limite)
  bannerEnabled: boolean;
  bannerMessage: string;
  bannerSubtext: string;
  bannerMessageEn: string; // vazio → usa o texto PT
  bannerSubtextEn: string;
  bannerStartsAt: string;
  bannerEndsAt: string;
  // Métodos de pagamento ligados no backoffice (os da IfthenPay também precisam das chaves na API)
  paymentMbwayEnabled: boolean;
  paymentMultibancoEnabled: boolean;
  paymentCardEnabled: boolean;
  paymentApplePayEnabled: boolean;
  paymentGooglePayEnabled: boolean;
  paymentTransferEnabled: boolean;
  paymentCashEnabled: boolean; // só com levantamento
}

type PaymentToggleField =
  | 'paymentMbwayEnabled' | 'paymentMultibancoEnabled' | 'paymentCardEnabled' | 'paymentApplePayEnabled'
  | 'paymentGooglePayEnabled' | 'paymentTransferEnabled' | 'paymentCashEnabled';
export const PAYMENT_TOGGLE_FIELDS: PaymentToggleField[] = [
  'paymentMbwayEnabled', 'paymentMultibancoEnabled', 'paymentCardEnabled', 'paymentApplePayEnabled',
  'paymentGooglePayEnabled', 'paymentTransferEnabled', 'paymentCashEnabled',
];

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
  freeShippingStartsAt: 'shipping_free_starts_at',
  freeShippingEndsAt: 'shipping_free_ends_at',
  bannerEnabled: 'banner_enabled',
  bannerMessage: 'banner_message',
  bannerSubtext: 'banner_subtext',
  bannerMessageEn: 'banner_message_en',
  bannerSubtextEn: 'banner_subtext_en',
  bannerStartsAt: 'banner_starts_at',
  bannerEndsAt: 'banner_ends_at',
  paymentMbwayEnabled: 'payment_mbway_enabled',
  paymentMultibancoEnabled: 'payment_multibanco_enabled',
  paymentCardEnabled: 'payment_card_enabled',
  paymentApplePayEnabled: 'payment_apple_pay_enabled',
  paymentGooglePayEnabled: 'payment_google_pay_enabled',
  paymentTransferEnabled: 'payment_transfer_enabled',
  paymentCashEnabled: 'payment_cash_enabled',
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
  freeShippingStartsAt: '',
  freeShippingEndsAt: '',
  bannerEnabled: false,
  bannerMessage: '',
  bannerSubtext: '',
  bannerMessageEn: '',
  bannerSubtextEn: '',
  bannerStartsAt: '',
  bannerEndsAt: '',
  paymentMbwayEnabled: true,
  paymentMultibancoEnabled: true,
  paymentCardEnabled: true,
  paymentApplePayEnabled: true,
  paymentGooglePayEnabled: true,
  paymentTransferEnabled: true,
  paymentCashEnabled: true,
};

// '' limpa a data; qualquer outro valor tem de ser uma data válida (guardada normalizada em ISO)
function normalizeOptionalDate(value: unknown, message: string): string {
  if (value === null || value === '') return '';
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadRequestException(message);
  }
  return new Date(value).toISOString();
}

/** O instante `now` está dentro do período [início, fim)? Datas vazias = sem limite. */
function isWithinPeriod(startsAt: string, endsAt: string, now: number): boolean {
  if (startsAt && now < Date.parse(startsAt)) return false;
  if (endsAt && now >= Date.parse(endsAt)) return false;
  return true;
}

/** Limites de portes grátis em vigor: fora do período configurado ficam todos a 0 (desativados). */
export function activeFreeShippingThresholds(s: PublicSettings, now: number = Date.now()) {
  const active = isWithinPeriod(s.freeShippingStartsAt, s.freeShippingEndsAt, now);
  return {
    pt: active ? s.freeShippingThreshold : 0,
    es: active ? s.freeShippingThresholdEs : 0,
    eu: active ? s.freeShippingThresholdEu : 0,
  };
}

/** Valida e devolve as entradas de um período opcional (início/fim). */
function periodEntries(
  startsRaw: unknown,
  endsRaw: unknown,
  current: { startsAt: string; endsAt: string },
  keys: { startsAt: string; endsAt: string },
  label: string,
): Array<[string, string]> {
  const startsAt = startsRaw !== undefined ? normalizeOptionalDate(startsRaw, `Data de início ${label} inválida.`) : undefined;
  const endsAt = endsRaw !== undefined ? normalizeOptionalDate(endsRaw, `Data de fim ${label} inválida.`) : undefined;
  const start = startsAt ?? current.startsAt;
  const end = endsAt ?? current.endsAt;
  if (start && end && Date.parse(end) <= Date.parse(start)) {
    throw new BadRequestException(`A data de fim ${label} tem de ser posterior à data de início.`);
  }
  const entries: Array<[string, string]> = [];
  if (startsAt !== undefined) entries.push([keys.startsAt, startsAt]);
  if (endsAt !== undefined) entries.push([keys.endsAt, endsAt]);
  return entries;
}

/** Liga/desliga métodos de pagamento; tem de ficar pelo menos um que sirva para envios (não só em mão). */
function paymentEntries(dto: Partial<PublicSettings>, current: PublicSettings): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const field of PAYMENT_TOGGLE_FIELDS) {
    if (dto[field] === undefined) continue;
    if (typeof dto[field] !== 'boolean') throw new BadRequestException('Valor inválido nos métodos de pagamento.');
    entries.push([KEYS[field], String(dto[field])]);
  }
  if (entries.length === 0) return entries;
  const final = (f: PaymentToggleField) => (dto[f] !== undefined ? dto[f] === true : current[f]);
  const hasShippingMethod = PAYMENT_TOGGLE_FIELDS.some((f) => f !== 'paymentCashEnabled' && final(f));
  if (!hasShippingMethod) {
    throw new BadRequestException('Tem de ficar ativo pelo menos um método de pagamento além do pagamento em mão.');
  }
  return entries;
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
      freeShippingStartsAt: map.get(KEYS.freeShippingStartsAt) ?? DEFAULTS.freeShippingStartsAt,
      freeShippingEndsAt: map.get(KEYS.freeShippingEndsAt) ?? DEFAULTS.freeShippingEndsAt,
      bannerEnabled: map.get(KEYS.bannerEnabled) === 'true',
      bannerMessage: map.get(KEYS.bannerMessage) ?? DEFAULTS.bannerMessage,
      bannerSubtext: map.get(KEYS.bannerSubtext) ?? DEFAULTS.bannerSubtext,
      bannerMessageEn: map.get(KEYS.bannerMessageEn) ?? DEFAULTS.bannerMessageEn,
      bannerSubtextEn: map.get(KEYS.bannerSubtextEn) ?? DEFAULTS.bannerSubtextEn,
      bannerStartsAt: map.get(KEYS.bannerStartsAt) ?? DEFAULTS.bannerStartsAt,
      bannerEndsAt: map.get(KEYS.bannerEndsAt) ?? DEFAULTS.bannerEndsAt,
      ...Object.fromEntries(PAYMENT_TOGGLE_FIELDS.map((field) => [
        field,
        map.has(KEYS[field]) ? map.get(KEYS[field]) === 'true' : DEFAULTS[field],
      ])) as Pick<PublicSettings, PaymentToggleField>,
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
    const needsCurrent = [dto.freeShippingStartsAt, dto.freeShippingEndsAt, dto.bannerStartsAt, dto.bannerEndsAt]
      .some((v) => v !== undefined) || dto.bannerEnabled === true
      || PAYMENT_TOGGLE_FIELDS.some((f) => dto[f] !== undefined);
    const current = needsCurrent ? await this.getPublicSettings() : DEFAULTS;
    entries.push(...periodEntries(
      dto.freeShippingStartsAt, dto.freeShippingEndsAt,
      { startsAt: current.freeShippingStartsAt, endsAt: current.freeShippingEndsAt },
      { startsAt: KEYS.freeShippingStartsAt, endsAt: KEYS.freeShippingEndsAt },
      'dos portes grátis',
    ));
    entries.push(...this.bannerEntries(dto, current));
    entries.push(...paymentEntries(dto, current));

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

  private bannerEntries(dto: Partial<PublicSettings>, current: PublicSettings): Array<[string, string]> {
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

    entries.push(...periodEntries(
      dto.bannerStartsAt, dto.bannerEndsAt,
      { startsAt: current.bannerStartsAt, endsAt: current.bannerEndsAt },
      { startsAt: KEYS.bannerStartsAt, endsAt: KEYS.bannerEndsAt },
      'do banner',
    ));

    if (dto.bannerEnabled === true) {
      const message = dto.bannerMessage !== undefined ? dto.bannerMessage.trim() : current.bannerMessage;
      if (!message) throw new BadRequestException('Para ativar o banner é preciso escrever a mensagem.');
    }
    return entries;
  }
}
