'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const prefix = `/${locale}`;

  return (
    <header className="bg-brand-dark text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href={`${prefix}/`} className="flex items-center">
          <Image
            src="/images/marca/logo.png"
            alt="ReaxOne"
            width={130}
            height={37}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href={`${prefix}/loja`} className="text-sm font-medium hover:text-brand-green transition-colors">
            {t('shop')}
          </Link>
          <Link href={`${prefix}/sobre`} className="text-sm font-medium hover:text-brand-green transition-colors">
            {t('about')}
          </Link>
          <Link href={`${prefix}/contacto`} className="text-sm font-medium hover:text-brand-green transition-colors">
            {t('contact')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          {/* Language switcher */}
          <Link
            href={locale === 'pt' ? '/en' : '/pt'}
            className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            {locale === 'pt' ? 'EN' : 'PT'}
          </Link>

          {/* Cart */}
          <Link href={`${prefix}/carrinho`} className="relative hover:text-brand-green transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link href={`${prefix}/auth`} className="hover:text-brand-green transition-colors">
            <User className="w-5 h-5" />
          </Link>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-gray border-t border-white/10 px-6 py-4 space-y-1">
          {[
            { href: `${prefix}/loja`, label: t('shop') },
            { href: `${prefix}/sobre`, label: t('about') },
            { href: `${prefix}/contacto`, label: t('contact') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm py-3 px-2 rounded-lg hover:bg-white/10 hover:text-brand-green transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
