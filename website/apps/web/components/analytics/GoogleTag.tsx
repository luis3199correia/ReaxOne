import { GTM_ID, googleTagHeadScript } from '@/lib/analytics';

/** Vai dentro do <head>: Consent Mode por omissão + Google Tag Manager. */
export function GoogleTagHead() {
  return <script id="google-tag" dangerouslySetInnerHTML={{ __html: googleTagHeadScript() }} />;
}

/** Logo a seguir à abertura do <body> (browsers sem JavaScript). */
export function GoogleTagNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
