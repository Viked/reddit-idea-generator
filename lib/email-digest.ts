import { resend } from '@/lib/resend'
import { IdeaDigestEmail } from '@/components/emails/idea-digest'
import { Database } from '@/types/database'

type Idea = Database['public']['Tables']['ideas']['Row']
type User = Database['public']['Tables']['users']['Row']

interface SendIdeaDigestResult {
  emailsSent: number
  emailsFailed: number
  results: Array<{
    userId: string
    sent: boolean
    emailId?: string
    error?: string
    reason?: string
  }>
}

/**
 * Sends idea digest emails to subscribed users
 * @param users - Array of users to send emails to
 * @param ideas - Array of ideas to include in the digest
 * @returns Result object with email sending statistics
 */
export async function sendIdeaDigest(
  users: User[],
  ideas: Idea[]
): Promise<SendIdeaDigestResult> {
  if (!ideas || ideas.length === 0) {
    return {
      emailsSent: 0,
      emailsFailed: 0,
      results: users.map((user) => ({
        userId: user.id,
        sent: false,
        reason: 'No ideas to send',
      })),
    }
  }

  if (!users || users.length === 0) {
    return {
      emailsSent: 0,
      emailsFailed: 0,
      results: [],
    }
  }

  // Filter users who have 'all' in their subscription_topics array
  const subscribedUsers = users.filter((user) => {
    const topics = (user.subscription_topics || []) as string[]
    return Array.isArray(topics) && topics.length > 0 && topics.includes('all')
  })

  if (subscribedUsers.length === 0) {
    return {
      emailsSent: 0,
      emailsFailed: 0,
      results: [],
    }
  }

  // Send emails to all subscribed users
  const emailPromises = subscribedUsers.map(async (user: User) => {
    const topics = user.subscription_topics || []

    try {
      const html = IdeaDigestEmail({
        ideas,
        topic: topics.includes('all') ? undefined : topics[0],
      })

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Reddit Idea Generator <onboarding@resend.dev>',
        to: user.email,
        subject: `Your Daily Idea Digest - ${ideas.length} New Ideas`,
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
    emailsSent: sentCount,
    emailsFailed: failedCount,
    results,
  }
}

