import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Get the token to check if user is authenticated
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const isAuth = !!token
  const isAuthRoute = /^\/(sign-in|forgot-password|reset-password)/.test(pathname)
  const isRootRoute = pathname === '/'
  const isPublicRoute = pathname === '/login' || pathname === '/'

  // Allow access to root route and public routes
  if (isRootRoute || isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect non-app routes to /app prefix (except auth routes)
  if (!pathname.startsWith('/app') && !isAuthRoute && !pathname.startsWith('/admin')) {
    const newUrl = new URL(`/app${pathname}`, request.nextUrl.origin)
    return NextResponse.redirect(newUrl)
  }

  // Protect /app and /admin routes
  if (pathname.startsWith('/app') || pathname.startsWith('/admin')) {
    if (!isAuth) {
      const signInUrl = new URL('/login', request.nextUrl.origin)
      signInUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // Redirect authenticated users away from auth routes
  if (isAuth && isAuthRoute) {
    const from = request.nextUrl.searchParams.get("from") || '/app'
    return NextResponse.redirect(new URL(from, request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}