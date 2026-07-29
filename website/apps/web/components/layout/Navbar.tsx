'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart, User, Menu, X, Instagram, LayoutDashboard,
  Package, Tag, ShoppingBag, Users, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
type AuthUser = { id: string; email: string; role: string } | null;

export default function Navbar() {
  const t = useTranslations('nav');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const prefix = `/${locale}`;

  const adminLinks = [
    { href: `${prefix}/admin`,               label: tAdmin('dashboard'), icon: LayoutDashboard },
    { href: `${prefix}/admin/produtos`,      label: tAdmin('products'),  icon: Package },
    { href: `${prefix}/admin/categorias`,    label: 'Categorias',        icon: Tag },
    { href: `${prefix}/admin/encomendas`,    label: tAdmin('orders'),    icon: ShoppingBag },
    { href: `${prefix}/admin/clientes`,      label: tAdmin('customers'), icon: Users },
    { href: `${prefix}/admin/configuracoes`, label: tAdmin('settings'),  icon: Settings },
  ];

  useEffect(() => {
    // Usa fetch diretamente para não acionar o interceptor do axios (que redireciona em 401)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAuthUser(data))
      .catch(() => setAuthUser(null));
  }, []);

  return (
    <header className="bg-brand-dark text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href={`${prefix}/`} className="flex items-center">
          <Image
            src="/images/identidade/texto-branco.svg"
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

          {/* Instagram */}
          <a
            href="https://www.instagram.com/reax.one/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-green transition-colors hidden md:block"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>

          {/* Cart */}
          <Link href={`${prefix}/carrinho`} className="relative hover:text-brand-green transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account / Admin */}
          {authUser?.role === 'ADMIN' ? (
            <div className="relative">
              <button
                onClick={() => setAdminMenuOpen((o) => !o)}
                className="hover:text-brand-green transition-colors"
                title="Backoffice"
                aria-label="Backoffice"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>

              {adminMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAdminMenuOpen(false)} />
                  <div className="absolute right-0 mt-3 w-48 bg-white text-brand-dark rounded-lg shadow-2xl py-2 z-50">
                    {adminLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAdminMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-gray-500" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : authUser ? (
            <Link href={`${prefix}/conta`} className="hover:text-brand-green transition-colors" title="A minha conta">
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link href={`${prefix}/auth`} className="hover:text-brand-green transition-colors" title="Entrar">
              <User className="w-5 h-5" />
            </Link>
          )}

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
