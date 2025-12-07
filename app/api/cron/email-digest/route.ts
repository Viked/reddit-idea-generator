import { NextRequest, NextResponse } from 'next/server'
import { sendEmailDigest } from '@/lib/email-digest'

/**
 * Email digest cron job endpoint
 * 
 * Triggered by Vercel Cron (GET request)
 * Fetches new ideas from last 24h and sends digest emails to subscribed users
 */
export async function GET(request: NextRequest) {
  // Verify this is a cron request (optional: add auth header check)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendEmailDigest()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in email digest cron:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
