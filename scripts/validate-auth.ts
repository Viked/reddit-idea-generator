import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

async function validateAuth() {
  let hasErrors = false

  // Test 1: Check proxy.ts existence (Next.js 16 uses proxy instead of middleware)
  console.log('Test 1: Checking proxy.ts...')
  const proxyPath = resolve(process.cwd(), 'proxy.ts')
  if (existsSync(proxyPath)) {
    console.log('✅ proxy.ts exists')
  } else {
    console.error('❌ proxy.ts not found')
    hasErrors = true
  }

  // Test 2: Validate RESEND_API_KEY is present (or MOCK_MODE is on)
  console.log('\nTest 2: Validating email configuration...')
  const resendApiKey = process.env.RESEND_API_KEY
  const mockMode = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1'

  if (resendApiKey) {
    console.log('✅ RESEND_API_KEY is set')
  } else if (mockMode) {
    console.log('✅ MOCK_MODE is enabled (RESEND_API_KEY not required)')
  } else {
    console.error('❌ RESEND_API_KEY is missing and MOCK_MODE is not enabled')
    console.error('   Either set RESEND_API_KEY or set MOCK_MODE=true')
    hasErrors = true
  }

  // Test 3: Mock Send - Import sendEmail logic and trigger a test send
  console.log('\nTest 3: Testing email send functionality...')
  try {
    // Import the resend client
    const { resend } = await import('../lib/resend')

    // Attempt to send a test email
    const testResult = await resend.emails.send({
      from: 'test@example.com',
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    })

    if (testResult.error) {
      console.error('❌ Email send failed:', testResult.error.message)
      hasErrors = true
    } else {
      if (mockMode || !resendApiKey) {
        console.log('✅ Email send test passed (MOCK MODE - logged to console)')
      } else {
        console.log('✅ Email send test passed')
        console.log(`   Email ID: ${testResult.data?.id || 'N/A'}`)
      }
    }
  } catch (error) {
    console.error('❌ Email send test failed:', error instanceof Error ? error.message : 'Unknown error')
    hasErrors = true
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  if (hasErrors) {
    console.error('❌ Auth validation failed')
    process.exit(1)
  } else {
    console.log('✅ All auth validation tests passed')
  }
}

// Run validation
validateAuth()

