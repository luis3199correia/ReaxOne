/**
 * Google Tag Manager + Consent Mode v2 + evento de compra (GA4 ecommerce).
 *
 * O GTM só é carregado depois de definido o consentimento por omissão (tudo recusado);
 * a escolha do visitante fica em localStorage e é reaplicada no <head> em cada visita.
 */

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-MT8VFJ8L';

export const CONSENT_STORAGE_KEY = 'reaxone_consent';
export const CONSENT_VERSION = 1;
/** Evento para reabrir o aviso de cookies (ex.: link no rodapé). */
export const OPEN_CONSENT_EVENT = 'reaxone:open-cookie-settings';

const PURCHASE_KEY_PREFIX = 'reaxone_purchase_';
const CURRENCY = 'EUR';

export interface ConsentChoice {
  analytics: boolean;
  ads: boolean;
}

interface StoredConsent extends ConsentChoice {
  v: number;
  at: string;
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

function dataLayer(): unknown[] | null {
  if (typeof window === 'undefined') return null;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}

/** Equivalente ao gtag() do Google: o GTM lê os comandos como objetos `arguments`. */
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  dataLayer()?.push(arguments);
}

/* ─── Consentimento ─────────────────────────────────────────────────────── */

export function consentState({ analytics, ads }: ConsentChoice) {
  const ad = ads ? 'granted' : 'denied';
  return {
    analytics_storage:  analytics ? 'granted' : 'denied',
    ad_storage:         ad,
    ad_user_data:       ad,
    ad_personalization: ad,
  } as const;
}

export function readConsent(): ConsentChoice | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null') as StoredConsent | null;
    if (!raw || raw.v !== CONSENT_VERSION) return null;
    return { analytics: !!raw.analytics, ads: !!raw.ads };
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  const stored: StoredConsent = { v: CONSENT_VERSION, at: new Date().toISOString(), ...choice };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // modo privado / armazenamento bloqueado: a escolha vale só para esta página
  }
  gtag('consent', 'update', consentState(choice));
  dataLayer()?.push({ event: 'consent_update', consent_analytics: choice.analytics, consent_ads: choice.ads });
}

/**
 * Script inline do <head>: consentimento por omissão (recusado), reaplica a escolha
 * guardada e só depois carrega o GTM (snippet oficial, com o evento gtm.js).
 */
export function googleTagHeadScript(gtmId: string = GTM_ID): string {
  const id = JSON.stringify(gtmId);
  const key = JSON.stringify(CONSENT_STORAGE_KEY);
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
try {
  var c = JSON.parse(localStorage.getItem(${key}) || 'null');
  if (c && c.v === ${CONSENT_VERSION}) {
    var ad = c.ads ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: ad, ad_user_data: ad, ad_personalization: ad
    });
  }
} catch (e) {}
gtag('js', new Date());
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${id});
`.trim();
}

/* ─── Evento de compra ──────────────────────────────────────────────────── */

export interface PurchaseLine {
  /** Slug do produto — é o g:id dos feeds do Google Merchant Center. */
  slug: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

export interface PurchaseInput {
  orderId: string;
  total: number;
  shipping?: number;
  discountCode?: string;
  lines: PurchaseLine[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Número da encomenda tal como aparece ao cliente, nos emails e no backoffice (#XXXXXXXX). */
export function orderReference(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function buildPurchaseEvent(input: PurchaseInput) {
  return {
    event: 'purchase',
    ecommerce: {
      transaction_id: orderReference(input.orderId),
      value:          round2(input.total),
      currency:       CURRENCY,
      ...(input.shipping !== undefined ? { shipping: round2(input.shipping) } : {}),
      ...(input.discountCode ? { coupon: input.discountCode } : {}),
      items: input.lines
        .filter((l) => l.slug)
        .map((l, index) => ({
          item_id:   l.slug,
          item_name: l.name,
          price:     round2(l.price),
          quantity:  l.quantity,
          index,
          ...(l.size ? { item_variant: l.size } : {}),
        })),
    },
  };
}

/** Guarda a compra até à página de confirmação (sobrevive ao redirect do cartão). */
export function savePendingPurchase(input: PurchaseInput) {
  try {
    sessionStorage.setItem(PURCHASE_KEY_PREFIX + input.orderId, JSON.stringify(buildPurchaseEvent(input)));
  } catch {
    // sem sessionStorage não há evento — a encomenda segue normalmente
  }
}

/** Envia a compra guardada para o dataLayer, uma única vez por encomenda. */
export function pushPendingPurchase(orderId: string) {
  if (!orderId) return;
  try {
    const key = PURCHASE_KEY_PREFIX + orderId;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    sessionStorage.removeItem(key);
    const layer = dataLayer();
    layer?.push({ ecommerce: null }); // limpa o ecommerce anterior (recomendação do GTM)
    layer?.push(JSON.parse(raw));
  } catch {
    // dados corrompidos ou armazenamento bloqueado: ignora
  }
}
