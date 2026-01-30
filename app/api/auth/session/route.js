import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('nexsight-session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    const session = JSON.parse(sessionCookie.value)
    return NextResponse.json({ user: session })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
