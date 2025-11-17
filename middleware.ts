import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('coach-auth');
  const isAuthenticated = authCookie?.value === 'authenticated';
  
  const { pathname } = request.nextUrl;
  
  // Protect /coach route and its sub-routes
  if (pathname.startsWith('/coach')) {
    if (!isAuthenticated) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/coach/:path*'],
};
