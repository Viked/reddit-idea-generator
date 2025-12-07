import { z } from 'zod'

/**
 * Client-side environment variables (exposed to the browser)
 * These must be prefixed with NEXT_PUBLIC_
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL').optional(),
})

/**
 * Server-side environment variables (private, not exposed to the browser)
 * 
 * Note: Supabase variables are required as they are the core database.
 * Other service variables (OpenAI, Inngest, Resend) are optional to allow
 * the app to run in mock mode or with partial integrations.
 */
const serverEnvSchema = z.object({
  // Supabase (required - core database)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // OpenAI (optional until integration is implemented)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required').optional(),
  
  // App Logic
  MOCK_MODE: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  // Reddit User Agent (optional until integration is implemented)
  REDDIT_USER_AGENT: z.string().min(1, 'REDDIT_USER_AGENT is required').optional(),
  
  // Email (optional until integration is implemented)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required').optional(),
})

/**
 * Validates and parses client-side environment variables
 * This runs automatically on import and throws if validation fails
 */
function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }

  const result = clientEnvSchema.safeParse(clientEnv)

  if (!result.success) {
    const missingKeys = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(
      `❌ Missing or invalid client environment variables: ${missingKeys}\n` +
      `Please check your .env.local file and ensure all required variables are set.`
    )
  }

  return result.data
}

/**
 * Validates and parses server-side environment variables
 * This runs automatically on import and throws if validation fails
 */
function validateServerEnv() {
  const serverEnv = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MOCK_MODE: process.env.MOCK_MODE,
    REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  }

  const result = serverEnvSchema.safeParse(serverEnv)

  if (!result.success) {
    const missingKeys = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(
      `❌ Missing or invalid server environment variables: ${missingKeys}\n` +
      `Please check your .env.local file and ensure all required variables are set.`
    )
  }

  return result.data
}

// Validate and export client environment variables
// This runs automatically when the module is imported
export const clientEnv = validateClientEnv()

// Validate and export server environment variables
// This runs automatically when the module is imported
// Only available on the server side (use typeof window === 'undefined' check if needed)
export const serverEnv = typeof window === 'undefined' ? validateServerEnv() : null

/**
 * Combined environment object for convenience
 * Use this when you need both client and server env vars
 */
export const env = {
  ...clientEnv,
  ...(typeof window === 'undefined' ? serverEnv : {}),
} as typeof clientEnv & typeof serverEnv

