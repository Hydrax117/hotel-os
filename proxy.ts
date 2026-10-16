import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Subdomain routing ─────────────────────────────────────────────────────────
//
// hotel.domain.com  → hotel owner portal (landing, auth, onboarding, dashboard, admin)
// domain.com        → traveler site (homepage, search, hotels, booking)
//
// In local dev both subdomains resolve to localhost:3000. To simulate the hotel
// subdomain locally, add this to your /etc/hosts (or Windows hosts file):
//   127.0.0.1 hotel.localhost
// Then visit http://hotel.localhost:3000
//
// Production: point hotel.yourdomain.com to the same Next.js deployment as
// yourdomain.com — this proxy handles the routing at the edge.

// Routes that are shared (static assets, Next.js internals) — always pass through
const SHARED_PATH_PREFIXES = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/public',
];

function isHotelSubdomain(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? '';
  // hotel.localhost (local dev) or hotel.* (production subdomains)
  return host.startsWith('hotel.');
}

function isSharedPath(pathname: string): boolean {
  return SHARED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass shared paths (static assets, API routes) through unchanged
  if (isSharedPath(pathname)) {
    return NextResponse.next();
  }

  if (isHotelSubdomain(request)) {
    // ── hotel.domain.com ──────────────────────────────────────────────────────

    // Root → rewrite to /hotel-home (keep URL clean)
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/hotel-home';
      return NextResponse.rewrite(url);
    }

    // /auth/signup → rewrite with context=owner so the signup form knows the context
    if (pathname === '/auth/signup') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signup';
      url.searchParams.set('context', 'owner');
      return NextResponse.rewrite(url);
    }

    // /auth/signin → rewrite with context=owner
    if (pathname === '/auth/signin') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('context', 'owner');
      return NextResponse.rewrite(url);
    }

    // All other /auth/* paths — pass through as-is
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next();
    }

    // Owner-specific paths — pass through as-is
    if (
      pathname.startsWith('/dashboard/') ||
      pathname.startsWith('/onboarding/') ||
      pathname.startsWith('/admin/')
    ) {
      return NextResponse.next();
    }

    // Exact owner root paths (e.g. /dashboard, /onboarding, /admin)
    if (
      pathname === '/dashboard' ||
      pathname === '/onboarding' ||
      pathname === '/admin'
    ) {
      return NextResponse.next();
    }

    // /hotel-home — pass through (prevent redirect loop)
    if (pathname === '/hotel-home') {
      return NextResponse.next();
    }

    // /hotel-review — pass through (verification pending page has its own auth guard)
    if (pathname === '/hotel-review') {
      return NextResponse.next();
    }

    // Any other path on the hotel subdomain → redirect to /hotel-home
    const url = request.nextUrl.clone();
    url.pathname = '/hotel-home';
    return NextResponse.redirect(url);
  } else {
    // ── domain.com ────────────────────────────────────────────────────────────

    // Owner paths should not be accessible from the main domain — redirect to home
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/admin') ||
      pathname === '/hotel-home' ||
      pathname.startsWith('/hotel-home/')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // All other traveler paths pass through
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next.js internals and static files.
     * The proxy function itself handles _next/ and public/ via isSharedPath,
     * but we keep them in the negative lookahead as a performance shortcut so
     * the proxy is never even invoked for them.
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
