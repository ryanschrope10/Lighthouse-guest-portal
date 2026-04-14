import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith('/api');
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js';

  // Let API routes and static assets pass through
  if (isStaticAsset || isApiRoute) {
    return NextResponse.next({ request });
  }

  // Verify JWT from cookie
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;

  // Redirect unauthenticated users to login
  if (!payload && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (payload && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
