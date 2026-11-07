import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

/**
 * Route protection:
 *  - /admin/*  → admins only (members are redirected to /member)
 *  - /member/* → members only (admins are redirected to /admin)
 *  - unauthenticated users are redirected to /login?callbackUrl=...
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/member', req.url));
    }
    if (pathname.startsWith('/member') && role !== 'member') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: { signIn: '/login' },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/member/:path*'],
};
