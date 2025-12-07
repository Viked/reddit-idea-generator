import { Resend } from 'resend'
import { serverEnv } from '@/lib/env'

let resendClient: Resend | null = null

/**
 * Creates and returns a Resend client instance
 * If RESEND_API_KEY is missing or MOCK_MODE is true, returns a mock client
 */
function createResendClient() {
  if (serverEnv?.MOCK_MODE || !serverEnv?.RESEND_API_KEY) {
    // Return a mock client that logs instead of sending
    return {
      emails: {
        send: async (options: Parameters<Resend['emails']['send']>[0]) => {
          console.log('📧 [MOCK MODE] Email would be sent:')
          console.log('  To:', options.to)
          console.log('  Subject:', options.subject)
          console.log('  From:', options.from)
          if (options.html) {
            console.log('  HTML:', options.html.substring(0, 200) + '...')
          }
          if (options.text) {
            console.log('  Text:', options.text.substring(0, 200) + '...')
          }
          return {
            data: { id: 'mock-email-id' },
            error: null,
          }
        },
      },
    } as Resend
  }

  if (!resendClient) {
    resendClient = new Resend(serverEnv.RESEND_API_KEY)
  }

  return resendClient
}

export const resend = createResendClient()

