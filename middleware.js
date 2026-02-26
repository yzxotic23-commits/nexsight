import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(request) {
  // Check if accessing dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('nexsight-session')

    // If no session, redirect to login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      const session = JSON.parse(sessionCookie.value)
      // Check if user is active (optional additional check)
      if (!session || !session.id) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // Invalid session, redirect to login
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
