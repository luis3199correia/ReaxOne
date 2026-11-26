// Google Avaliações do Consumidor (Customer Reviews): dados do opt-in da encomenda.
// O checkout guarda-os em sessionStorage (sobrevive ao redirect do cartão) e a
// página de confirmação lê-os para mostrar o pedido de inquérito.
// https://support.google.com/merchants/answer/7106244

export const GCR_MERCHANT_ID = 5898432815;

const SURVEY_KEY_PREFIX = 'gcr_survey_';

// Dias (de calendário) entre a encomenda e a entrega prevista, por país de entrega
const DELIVERY_DAYS_PT = 4;
const DELIVERY_DAYS_ES = 7;
const DELIVERY_DAYS_EU = 10;

export interface SurveyOptIn {
  orderId: string;
  email: string;
  country: string;               // ISO 3166-1 alpha-2, ex.: PT
  estimatedDeliveryDate: string; // YYYY-MM-DD
}

/** Dias até à entrega: 4 em Portugal, 7 em Espanha, 10 no resto da UE. */
export function deliveryDaysFor(country: string): number {
  if (country === 'PT') return DELIVERY_DAYS_PT;
  if (country === 'ES') return DELIVERY_DAYS_ES;
  return DELIVERY_DAYS_EU;
}

/** Data (local) depois de somar dias de calendário, em YYYY-MM-DD. Não altera `from`. */
export function addDays(from: Date, days: number): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Dados do opt-in para uma encomenda com envio, ou null se faltar algo
 * (sem email ou país válido não há inquérito).
 */
export function buildSurveyOptIn(input: {
  orderId: string;
  email: string;
  country: string;
  orderDate?: Date;
}): SurveyOptIn | null {
  const email = input.email.trim();
  const country = input.country.trim().toUpperCase();
  if (!input.orderId || !email || !/^[A-Z]{2}$/.test(country)) return null;
  return {
    orderId: input.orderId,
    email,
    country,
    estimatedDeliveryDate: addDays(input.orderDate ?? new Date(), deliveryDaysFor(country)),
  };
}

export function savePendingSurvey(survey: SurveyOptIn) {
  try {
    sessionStorage.setItem(SURVEY_KEY_PREFIX + survey.orderId, JSON.stringify(survey));
  } catch {
    // sem sessionStorage não há inquérito — a encomenda segue normalmente
  }
}

export function readPendingSurvey(orderId: string): SurveyOptIn | null {
  if (!orderId) return null;
  try {
    const survey = JSON.parse(sessionStorage.getItem(SURVEY_KEY_PREFIX + orderId) ?? 'null') as SurveyOptIn | null;
    return survey?.orderId === orderId ? survey : null;
  } catch {
    return null;
  }
}
