import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'auth-token';

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

  // Check for auth cookie existence (lightweight gate).
  // Full JWT verification happens in the portal layout (Node.js runtime).
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Redirect unauthenticated users to login
  if (!token && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (token && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
