import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const startTime = Date.now()

  try {
    const supabase = createClient()
    
    // Attempt to query the subreddits table
    const { error, count } = await supabase
      .from('subreddits')
      .select('*', { count: 'exact', head: true })

    if (error) {
      const latency = Date.now() - startTime
      return NextResponse.json(
        {
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
          latency: `${latency}ms`,
        },
        { status: 500 }
      )
    }

    const latency = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      count: count ?? 0,
    })
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`,
      },
      { status: 500 }
    )
  }
}

