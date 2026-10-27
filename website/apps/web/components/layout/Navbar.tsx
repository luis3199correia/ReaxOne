'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
import {
  ShoppingCart, User, Menu, X, Instagram, LayoutDashboard,
  Package, Tag, ShoppingBag, Users, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import type { StaticPathname } from '@/i18n/routing';
type AuthUser = { id: string; email: string; role: string } | null;

export default function Navbar() {
  const t = useTranslations('nav');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const adminLinks: { href: StaticPathname; label: string; icon: typeof Package }[] = [
    { href: '/admin',               label: tAdmin('dashboard'), icon: LayoutDashboard },
    { href: '/admin/produtos',      label: tAdmin('products'),  icon: Package },
    { href: '/admin/categorias',    label: 'Categorias',        icon: Tag },
    { href: '/admin/encomendas',    label: tAdmin('orders'),    icon: ShoppingBag },
    { href: '/admin/clientes',      label: tAdmin('customers'), icon: Users },
    { href: '/admin/configuracoes', label: tAdmin('settings'),  icon: Settings },
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
        <Link href="/" className="flex items-center">
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
          <Link href="/loja" className="text-sm font-medium hover:text-brand-green transition-colors">
            {t('shop')}
          </Link>
          <Link href="/sobre" className="text-sm font-medium hover:text-brand-green transition-colors">
            {t('about')}
          </Link>
          <Link href="/contacto" className="text-sm font-medium hover:text-brand-green transition-colors">
            {t('contact')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          {/* Language switcher */}
          {/* Mantém a página atual, com o URL traduzido do outro idioma */}
          <Link
            // pathname é a rota interna (ex: '/loja/[slug]') e params traz o slug
            // @ts-expect-error -- combinação pathname/params resolvida em runtime
            href={{ pathname, params }}
            locale={locale === 'pt' ? 'en' : 'pt'}
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
          <Link href="/carrinho" className="relative hover:text-brand-green transition-colors">
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
            <Link href="/conta" className="hover:text-brand-green transition-colors" title="A minha conta">
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link href="/auth" className="hover:text-brand-green transition-colors" title="Entrar">
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
          {([
            { href: '/loja', label: t('shop') },
            { href: '/sobre', label: t('about') },
            { href: '/contacto', label: t('contact') },
          ] satisfies { href: StaticPathname; label: string }[]).map(({ href, label }) => (
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
