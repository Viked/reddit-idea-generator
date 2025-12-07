import { NextResponse, type NextRequest } from 'next/server'
import { handleAuthProxy } from '@/lib/proxy/auth'

/**
 * Next.js 16 Proxy function
 * 
 * Executes before a request is completed, allowing for:
 * - Modifying headers
 * - Performing redirects
 * - Rewriting URLs
 * 
 * The proxy logic is organized in separate modules under lib/proxy/
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Handle authentication and authorization
  const authRedirect = await handleAuthProxy(request, response)
  if (authRedirect) {
    return authRedirect
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

