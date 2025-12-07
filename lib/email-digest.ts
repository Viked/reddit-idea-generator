import { createAdminClient } from '@/lib/supabase'
import { resend } from '@/lib/resend'
import { IdeaDigestEmail } from '@/components/emails/idea-digest'
import { Database } from '@/types/database'
import { serverEnv } from '@/lib/env'

type Idea = Database['public']['Tables']['ideas']['Row']
type User = Database['public']['Tables']['users']['Row']

interface EmailDigestResult {
  message: string
  ideasFound: number
  usersProcessed: number
  emailsSent: number
  emailsFailed: number
  intervalHours: number
  results: Array<{
    userId: string
    sent: boolean
    emailId?: string
    error?: string
    reason?: string
  }>
}

/**
 * Sends email digest to all subscribed users with new ideas
 * @param intervalHours - Number of hours to look back for ideas (default: from env or 24)
 * @returns Result object with email sending statistics
 */
export async function sendEmailDigest(
  intervalHours?: number
): Promise<EmailDigestResult> {
  const supabase = createAdminClient()

  // 1. Fetch "New" ideas created in the configured interval
  const hours = intervalHours || serverEnv?.EMAIL_DIGEST_INTERVAL_HOURS || 24
  const intervalStart = new Date()
  intervalStart.setHours(intervalStart.getHours() - hours)

  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('*')
    .gte('created_at', intervalStart.toISOString())
    .order('created_at', { ascending: false })

  if (ideasError) {
    throw new Error(`Failed to fetch ideas: ${ideasError.message}`)
  }

  if (!ideas || ideas.length === 0) {
    return {
      message: `No new ideas in the last ${hours} hour(s)`,
      ideasFound: 0,
      usersProcessed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      intervalHours: hours,
      results: [],
    }
  }

  // 2. Fetch all users with subscription_topics not empty
  // Fetch all users and filter in code to ensure we catch all subscribed users
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('*')

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`)
  }

  // Filter users who have 'all' in their subscription_topics array
  const users = ((allUsers || []) as User[]).filter((user: User) => {
    const topics = (user.subscription_topics || []) as string[]
    return Array.isArray(topics) && topics.length > 0 && topics.includes('all')
  })

  if (!users || users.length === 0) {
    return {
      message: 'No subscribed users found',
      ideasFound: ideas.length,
      usersProcessed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      intervalHours: hours,
      results: [],
    }
  }

  // 3. Loop users -> Filter ideas by topic -> Generate HTML -> Send email
  const emailPromises = users.map(async (user: User) => {
    const topics = user.subscription_topics || []

    // For MVP, if user has "all" in topics, send all ideas
    // Otherwise, filter by specific topics (future enhancement)
    let filteredIdeas: Idea[] = []

    if (topics.includes('all')) {
      filteredIdeas = ideas as Idea[]
    } else {
      // Future: Filter ideas by specific topics when topic field is added to ideas table
      filteredIdeas = ideas as Idea[]
    }

    if (filteredIdeas.length === 0) {
      return { userId: user.id, sent: false, reason: 'No matching ideas' }
    }

    try {
      const html = IdeaDigestEmail({
        ideas: filteredIdeas,
        topic: topics.includes('all') ? undefined : topics[0],
      })

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Reddit Idea Generator <onboarding@resend.dev>',
        to: user.email,
        subject: `Your Daily Idea Digest - ${filteredIdeas.length} New Ideas`,
        html,
      })

      if (error) {
        console.error(`Error sending email to ${user.email}:`, error)
        return { userId: user.id, sent: false, error: error.message }
      }

      return { userId: user.id, sent: true, emailId: data?.id }
    } catch (error) {
      console.error(`Exception sending email to ${user.email}:`, error)
      return {
        userId: user.id,
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // Wait for all emails to be sent (or attempted)
  const results = await Promise.all(emailPromises)

  const sentCount = results.filter((r) => r.sent).length
  const failedCount = results.filter((r) => !r.sent).length

  return {
    message: 'Email digest processed',
    ideasFound: ideas.length,
    usersProcessed: users.length,
    emailsSent: sentCount,
    emailsFailed: failedCount,
    intervalHours: hours,
    results,
  }
}

