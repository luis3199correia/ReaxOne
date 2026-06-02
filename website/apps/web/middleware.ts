import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const protectedRoutes = ['/conta', '/admin'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // COMING SOON
  // Ativo quando NEXT_PUBLIC_COMING_SOON=true no .env
  // Bypass automático: admin logado (role=ADMIN no JWT)
  // Bypass manual: cookie reaxone_preview=1
  //   → definido em /{locale}/auth após login admin
  //   → ou visitando /pt/admin (redireciona para auth se não logado)
  // ─────────────────────────────────────────────────────────────
  const comingSoon = process.env.NEXT_PUBLIC_COMING_SOON === 'true';

  if (comingSoon) {
    const isComingSoonPage = /^\/(pt|en)\/coming-soon/.test(pathname);
    const isAdminRoute     = /^\/(pt|en)\/admin/.test(pathname);
    const isAuthRoute      = /^\/(pt|en)\/auth/.test(pathname);
    const isStatic         = pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname === '/favicon.ico';
    const hasPreview       = request.cookies.get('reaxone_preview')?.value === '1';

    // Qualquer utilizador com sessão válida bypassa a landing
    const isLoggedIn = (() => {
      const token = request.cookies.get('reaxone_token')?.value;
      if (!token) return false;
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        // Verifica se o token não expirou
        return payload.exp ? payload.exp * 1000 > Date.now() : true;
      } catch { return false; }
    })();

    const bypass = isComingSoonPage || isAdminRoute || isAuthRoute || isStatic || hasPreview || isLoggedIn;

    if (!bypass) {
      const locale = pathname.split('/')[1] || defaultLocale;
      const validLocale = locales.includes(locale as any) ? locale : defaultLocale;
      return NextResponse.redirect(new URL(`/${validLocale}/coming-soon`, request.url));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Rotas protegidas por autenticação
  // ─────────────────────────────────────────────────────────────
  const pathnameWithoutLocale = pathname.replace(/^\/(pt|en)/, '');
  const isProtected = protectedRoutes.some((r) => pathnameWithoutLocale.startsWith(r));

  if (isProtected) {
    const token = request.cookies.get('reaxone_token')?.value;
    const locale = pathname.split('/')[1] || defaultLocale;

    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
    }

    if (pathnameWithoutLocale.startsWith('/admin')) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.role !== 'ADMIN') {
          return NextResponse.redirect(new URL(`/${locale}/conta`, request.url));
        }
      } catch {
        return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
