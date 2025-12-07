import { sendIdeaDigest } from '@/lib/email-digest'
import { Database } from '@/types/database'

type Idea = Database['public']['Tables']['ideas']['Row']
type User = Database['public']['Tables']['users']['Row']

/**
 * Validates the email digest flow
 * Tests sendIdeaDigest with mock data
 */
async function validateFlow() {
  console.log('🧪 Testing Email Digest Flow...\n')

  // Mock data
  const mockIdeas: Idea[] = [
    {
      id: 'mock-idea-1',
      title: 'Test Idea 1',
      pitch: 'This is a test pitch for idea 1',
      pain_point: 'Test pain point 1',
      score: 75,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-idea-2',
      title: 'Test Idea 2',
      pitch: 'This is a test pitch for idea 2',
      pain_point: 'Test pain point 2',
      score: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const mockUsers: User[] = [
    {
      id: 'mock-user-1',
      email: 'test@example.com',
      subscription_topics: ['all'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  try {
    console.log('📧 Sending mock email digest...')
    const result = await sendIdeaDigest(mockUsers, mockIdeas)

    console.log('\n✅ Email Digest Flow Test Results:')
    console.log(`   Emails Sent: ${result.emailsSent}`)
    console.log(`   Emails Failed: ${result.emailsFailed}`)
    console.log(`   Total Results: ${result.results.length}`)

    if (result.emailsSent > 0) {
      console.log('\n✅ Email sent (Mock Mode)')
    } else {
      console.log('\n⚠️  No emails were sent')
    }

    if (result.results.length > 0) {
      result.results.forEach((r, idx) => {
        console.log(`\n   Result ${idx + 1}:`)
        console.log(`     User ID: ${r.userId}`)
        console.log(`     Sent: ${r.sent}`)
        if (r.emailId) console.log(`     Email ID: ${r.emailId}`)
        if (r.error) console.log(`     Error: ${r.error}`)
        if (r.reason) console.log(`     Reason: ${r.reason}`)
      })
    }

    console.log('\n✅ Email digest flow validation complete!')
    console.log('\n📝 Manual Instruction:')
    console.log('   Please open http://localhost:3000/login and verify the card is centered and styled correctly.')
  } catch (error) {
    console.error('\n❌ Error validating email digest flow:', error)
    process.exit(1)
  }
}

validateFlow()

