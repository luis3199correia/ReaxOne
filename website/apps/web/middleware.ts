import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // / → /pt, /en → /en
});

const protectedRoutes = ['/conta', '/admin'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Remove o prefixo de locale para verificar a rota protegida
  const pathnameWithoutLocale = pathname.replace(/^\/(pt|en)/, '');

  const isProtected = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get('reaxone_token')?.value;
    const locale = pathname.split('/')[1] || defaultLocale;

    if (!token) {
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
    }

    if (pathnameWithoutLocale.startsWith('/admin')) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
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
