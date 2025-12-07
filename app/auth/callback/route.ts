import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { clientEnv } from '@/lib/env'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle magic link login (code parameter) - works for both magic links and email confirmations
  // Supabase uses the same exchangeCodeForSession method for both flows
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  const cookieStore = await cookies()
  
  // Create redirect response first - cookies will be set on it during exchange
  // Use the origin from the request to ensure we're redirecting to the same domain
  const baseUrl = clientEnv.NEXT_PUBLIC_SITE_URL || requestUrl.origin
  const redirectUrl = new URL(next, baseUrl)
  const response = NextResponse.redirect(redirectUrl)
  
  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on both the cookie store and the response
          // This ensures cookies are available for the redirect
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Exchange code for session - works for both magic links and email confirmations
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Error exchanging code for session:', error)
    // Handle specific error cases with user-friendly messages
    let errorMessage = error.message
    if (error.message.includes('already been used') || error.message.includes('already used')) {
      errorMessage = 'This link has already been used. Please request a new one.'
    } else if (error.message.includes('expired') || error.message.includes('expires')) {
      errorMessage = 'This link has expired. Please request a new one.'
    } else if (error.message.includes('invalid')) {
      errorMessage = 'Invalid authentication link. Please request a new one.'
    } else if (error.message.includes('email_not_confirmed')) {
      errorMessage = 'Please confirm your email address first. Check your inbox for a confirmation link.'
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
    )
  }

  // Code exchange successful - ensure user record exists
  // exchangeCodeForSession returns the user in data.user
  const user = data?.user || data?.session?.user
  
  if (user) {
    const { createAdminClient } = await import('@/lib/supabase')
    const adminSupabase = createAdminClient()

    // Check if user exists, if not create record
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // @ts-expect-error - Supabase type inference issue with users table
      await adminSupabase.from('users').insert({
        id: user.id,
        email: user.email || '',
        subscription_topics: [],
      })
    }
  } else {
    // Fallback: try to get user from session if not in response
    const { data: sessionData } = await supabase.auth.getUser()
    const sessionUser = sessionData?.user
    
    if (sessionUser) {
      const { createAdminClient } = await import('@/lib/supabase')
      const adminSupabase = createAdminClient()

      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('id', sessionUser.id)
        .single()

      if (!existingUser) {
        // @ts-expect-error - Supabase type inference issue with users table
        await adminSupabase.from('users').insert({
          id: sessionUser.id,
          email: sessionUser.email || '',
          subscription_topics: [],
        })
      }
    }
  }

  // Return the redirect response with cookies set
  return response
}

