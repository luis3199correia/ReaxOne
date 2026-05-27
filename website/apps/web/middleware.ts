import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // PT não tem prefixo, EN tem /en
});

const protectedRoutes = ['/conta', '/admin'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Remove o eventual prefixo de locale para verificar a rota
  const pathnameWithoutLocale = pathname.replace(/^\/(en)/, '');

  const isProtected = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get('reaxone_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    if (pathnameWithoutLocale.startsWith('/admin')) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
        if (payload.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/conta', request.url));
        }
      } catch {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
