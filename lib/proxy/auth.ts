import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { clientEnv } from '@/lib/env'

/**
 * Creates a Supabase client for proxy/middleware context
 */
function createProxySupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

/**
 * Handles authentication and authorization logic in the proxy
 * Returns a redirect response if needed, or null if request should proceed
 */
export async function handleAuthProxy(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse | null> {
  const supabase = createProxySupabaseClient(request, response)

  // Refresh session on every request
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If user accesses /dashboard without session -> Redirect to /login
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user accesses /login WITH session -> Redirect to /dashboard
  if (pathname.startsWith('/login') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // No redirect needed, proceed with request
  return null
}

