import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { scrapeAndGenerate } from '@/inngest/functions/scrape-and-generate'

/**
 * Inngest API route handler
 * 
 * IMPORTANT: For Inngest to discover and trigger functions:
 * 1. Next.js dev server must be running (npm run dev)
 * 2. Inngest dev server must be running (npm run inngest:dev)
 * 3. The Inngest dev server will auto-discover this endpoint at /api/inngest
 * 
 * To manually trigger function registration, send a PUT request:
 * curl -X PUT http://localhost:3000/api/inngest
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeAndGenerate],
})
