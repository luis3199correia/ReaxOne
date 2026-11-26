'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { GCR_MERCHANT_ID, readPendingSurvey } from '@/lib/customerReviews';
import { CONSENT_CHANGED_EVENT, ConsentChoice, readConsent } from '@/lib/analytics';

const PLATFORM_SCRIPT_SRC = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
const PLATFORM_SCRIPT_ID = 'google-platform-js';

type Gapi = {
  load: (module: string, cb: () => void) => void;
  surveyoptin: { render: (options: Record<string, unknown>) => void };
};

declare global {
  interface Window {
    gapi?: Gapi;
    renderOptIn?: () => void;
    ___gcfg?: { lang?: string };
  }
}

/**
 * Pedido de inquérito das Avaliações do Consumidor da Google, mostrado uma vez
 * na página de confirmação. Só aparece quando o checkout guardou os dados da
 * encomenda (encomendas com envio; sem levantamento nem só-ebooks) e o visitante
 * aceitou os cookies de Marketing — o script é da Google (apis.google.com).
 */
export default function CustomerReviewsOptIn({ orderId }: { orderId: string }) {
  const locale = useLocale();
  const rendered = useRef(false);
  const [hasAdsConsent, setHasAdsConsent] = useState(false);

  // Lido depois de montar (localStorage não existe no servidor) e atualizado se o
  // visitante aceitar os cookies já nesta página
  useEffect(() => {
    setHasAdsConsent(readConsent()?.ads === true);
    const onChange = (e: Event) => setHasAdsConsent((e as CustomEvent<ConsentChoice>).detail?.ads === true);
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!hasAdsConsent || rendered.current) return;
    const survey = readPendingSurvey(orderId);
    if (!survey) return;
    rendered.current = true;

    window.___gcfg = { lang: locale === 'en' ? 'en' : 'pt_PT' };
    window.renderOptIn = () => {
      window.gapi?.load('surveyoptin', () => {
        window.gapi?.surveyoptin.render({
          merchant_id: GCR_MERCHANT_ID,
          order_id: survey.orderId,
          email: survey.email,
          delivery_country: survey.country,
          estimated_delivery_date: survey.estimatedDeliveryDate,
        });
      });
    };

    // Navegação dentro do site: o script pode já estar carregado de uma encomenda anterior
    if (window.gapi) {
      window.renderOptIn();
      return;
    }
    if (document.getElementById(PLATFORM_SCRIPT_ID)) return;
    const script = document.createElement('script');
    script.id = PLATFORM_SCRIPT_ID;
    script.src = PLATFORM_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [orderId, locale, hasAdsConsent]);

  return null;
}
