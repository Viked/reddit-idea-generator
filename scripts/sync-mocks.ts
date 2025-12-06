import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'
import { promises as fs } from 'fs'
import { join } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function syncMocks() {
  try {
    // Fetch latest 50 rows from raw_posts
    const { data: posts, error } = await supabase
      .from('raw_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ Error fetching posts:', error)
      process.exit(1)
    }

    if (!posts || posts.length === 0) {
      console.warn('⚠️  No posts found in database')
      return
    }

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    // Write to mock-reddit.json
    const mockFilePath = join(dataDir, 'mock-reddit.json')
    await fs.writeFile(mockFilePath, JSON.stringify(posts, null, 2), 'utf-8')

    console.log(`✅ Synced ${posts.length} posts to mock file`)
  } catch (error) {
    console.error('❌ Error syncing mocks:', error)
    process.exit(1)
  }
}

// Run sync
syncMocks()

