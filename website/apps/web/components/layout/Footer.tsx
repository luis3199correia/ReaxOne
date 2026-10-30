import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Instagram } from 'lucide-react';


export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');

  return (
    <footer className="bg-brand-dark text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/identidade/texto-branco.svg"
              alt="ReaxOne"
              width={120}
              height={34}
              className="object-contain mb-3"
            />
            <p className="text-sm leading-relaxed mb-4">
              {t('tagline')}
            </p>
            <a
              href="https://www.instagram.com/reax.one/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors text-sm"
            >
              <Instagram className="w-4 h-4" />
              @reax.one
            </a>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">{t('shop_heading')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/loja" className="hover:text-brand-green transition-colors">{t('all_products')}</Link></li>
              <li><Link href={{ pathname: '/loja', query: { categoria: 'material-desportivo' } }} className="hover:text-brand-green transition-colors">{t('equipment')}</Link></li>
              <li><Link href={{ pathname: '/loja', query: { categoria: 'ebooks' } }} className="hover:text-brand-green transition-colors">{t('ebooks')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">{t('company_heading')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sobre" className="hover:text-brand-green transition-colors">{t('about')}</Link></li>
              <li><Link href="/contacto" className="hover:text-brand-green transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">{t('support_heading')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/envios" className="hover:text-brand-green transition-colors">{t('shipping_returns')}</Link></li>
              <li><Link href="/privacidade" className="hover:text-brand-green transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/termos" className="hover:text-brand-green transition-colors">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 mb-6 space-y-1 text-xs leading-relaxed text-gray-500">
          <p>{t('legal_brand')}</p>
          <p>
            {t('registered_office')}: Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz
            {' · '}{t('company_id')}: 519180976
            {' · '}{t('share_capital')}: 500 €
          </p>
          <p>
            {t('contact')}:{' '}
            <a href="mailto:contact@reaxone.com" className="hover:text-brand-green transition-colors">contact@reaxone.com</a>
            {' · '}
            <a href="tel:+351928456870" className="hover:text-brand-green transition-colors">+351 928 456 870</a>
          </p>
          <p>
            {t('complaints_book')}:{' '}
            <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="hover:text-brand-green transition-colors">www.livroreclamacoes.pt</a>
          </p>
          <p>
            {t('dispute_resolution')}: CNIACC –{' '}
            <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer" className="hover:text-brand-green transition-colors">www.cniacc.pt</a>
          </p>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} ReaxOne®. {t('rights')}</p>
          <p>🇵🇹 {t('made_in')}</p>
        </div>
      </div>
    </footer>
  );
}
