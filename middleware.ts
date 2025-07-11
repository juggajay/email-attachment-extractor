import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const protectedPaths = ['/emails', '/extract']
  const pathname = request.nextUrl.pathname

  // Check if the path needs protection
  const needsProtection = protectedPaths.some(path => pathname.startsWith(path))

  if (needsProtection) {
    // For middleware, we'll do a simple cookie check
    // The actual session validation happens in the API routes
    const sessionCookie = request.cookies.get('email-extractor-session')
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/emails/:path*', '/extract/:path*']
}