import { useLocale, useMessages } from 'next-intl';

// Nome da categoria no idioma ativo: nameEn da BD → category_names (messages) → nome PT
export function useCategoryLabel() {
  const locale = useLocale();
  const messages = useMessages() as any;

  return (name: string, slug?: string, nameEn?: string): string => {
    if (locale !== 'en') return name;
    return nameEn || (slug && messages?.category_names?.[slug]) || name;
  };
}
