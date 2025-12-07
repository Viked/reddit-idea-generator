import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { clientEnv } from '@/lib/env'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    // Create redirect response first - cookies will be set on it during exchange
    const redirectUrl = new URL(next, request.url)
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

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
      }
      
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }

    // Code exchange successful - ensure user record exists
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    }

    // Return the redirect response with cookies set
    return response
  }

  // No code provided
  return NextResponse.redirect(new URL('/login?error=no_code', request.url))
}

