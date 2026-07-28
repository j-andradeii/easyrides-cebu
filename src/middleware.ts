/**
 * Next.js Middleware
 *
 * Runs before routes are rendered. Gates the admin portal (plan §9.4) by
 * verifying the `auth-token` JWT signature — a cookie merely *existing* is not
 * proof of anything, so the signature is checked with `jose` (Edge-safe).
 *
 * API routes are excluded by the matcher below; they enforce access themselves
 * via `requireAdmin()` in each handler.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { AUTH_COOKIE, verifyAccessToken } from '@/lib/auth/jwt';

// Routes that require an authenticated admin
const protectedRoutes = ['/admin'];

// Routes that should bounce to the portal when already authenticated
const authRoutes = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthRoute;

  // Only pay for JWT verification on routes that care about it.
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const payload = await verifyAccessToken(request.cookies.get(AUTH_COOKIE)?.value);
  const isAuthenticated = payload !== null;

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes — they guard themselves with requireAdmin())
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
