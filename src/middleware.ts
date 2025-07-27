import { NextResponse , NextRequest } from 'next/server'
import { auth } from "@/auth"

export async function middleware(request : NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (session && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not logged in and trying to access dashboard pages, redirect to login
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match all paths except api routes, static files, and other assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}