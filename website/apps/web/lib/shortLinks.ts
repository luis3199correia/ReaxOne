import type { Locale } from '../i18n/config';

// Links fixos impressos nos QR codes das embalagens — os `paths` NUNCA podem mudar.
// O destino (loja filtrada pela categoria) pode mudar à vontade: o redirect é temporário (307),
// por isso nem browsers nem o Google o guardam em cache como definitivo.
// ATENÇÃO: `category` tem de ser igual ao slug da categoria no backoffice.
export const SHORT_LINKS: { paths: string[]; locale: Locale; category: string }[] = [
  { paths: ['/bolas', '/pt/bolas'], locale: 'pt', category: 'bolas' },
  { paths: ['/meias', '/pt/meias'], locale: 'pt', category: 'meias' },
  { paths: ['/en/balls', '/balls'], locale: 'en', category: 'bolas' },
  { paths: ['/en/socks', '/socks'], locale: 'en', category: 'meias' },
];
