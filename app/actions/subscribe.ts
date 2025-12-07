"use server";

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { clientEnv } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database'
import { resend } from '@/lib/resend'
import { SubscriptionConfirmationEmail } from '@/components/emails/subscription-confirmation'

type User = Database['public']['Tables']['users']['Row']

export async function toggleSubscription(topic: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Middleware handles cookie setting
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()

  // Get current user data
  const { data: userData, error: fetchError } = await adminSupabase
    .from('users')
    .select('subscription_topics')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    return { error: 'Failed to fetch user data' }
  }

  const typedUserData = userData as Pick<User, 'subscription_topics'> | null
  const currentTopics = (typedUserData?.subscription_topics || []) as string[]
  const isSubscribed = currentTopics.includes(topic)

  let newTopics: string[]
  if (isSubscribed) {
    // Remove topic
    newTopics = currentTopics.filter((t: string) => t !== topic)
  } else {
    // Add topic
    newTopics = [...currentTopics, topic]
  }

  const { error: updateError } = await adminSupabase
    .from('users')
    // @ts-expect-error - Supabase type inference issue with users table
    .update({ subscription_topics: newTopics })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to update subscription' }
  }

  const subscribed = !isSubscribed

  // Send confirmation email
  try {
    // Get user email from auth user
    const { data: userData } = await adminSupabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    const typedUserData = userData as Pick<User, 'email'> | null
    if (typedUserData?.email) {
      const html = SubscriptionConfirmationEmail({
        subscribed,
        topic,
      })

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Reddit Idea Generator <onboarding@resend.dev>',
        to: typedUserData.email,
        subject: subscribed
          ? `You're subscribed to idea updates!`
          : `You've unsubscribed from idea updates`,
        html,
      })
    }
  } catch (emailError) {
    // Log error but don't fail the subscription update
    console.error('Error sending subscription confirmation email:', emailError)
  }

  return {
    success: true,
    subscribed,
    message: isSubscribed
      ? `Unsubscribed from "${topic}"`
      : `Subscribed to "${topic}"`,
  }
}

