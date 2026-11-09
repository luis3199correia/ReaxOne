import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// Usado por notFound() em qualquer rota dentro de [locale] (ex: slug de produto inexistente)
export default async function NotFound() {
  const t = await getTranslations('shop');
  return (
    <div className="max-w-7xl mx-auto px-6 py-24 text-center">
      <p className="text-xl text-gray-500 mb-6">{t('product_not_found')}</p>
      <Link href="/loja" className="btn-primary">
        {t('see_all_shop')}
      </Link>
    </div>
  );
}
