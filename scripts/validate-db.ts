import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

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

// Initialize Supabase admin client directly (not using Next.js wrapper)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function validateDatabase() {
  try {
    // Perform a simple connection test - fetch 1 row from subreddits table
    const { data, error } = await supabase
      .from('subreddits')
      .select('id')
      .limit(1)

    if (error) {
      // Check if the error is due to missing table (schema not migrated)
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        console.error('❌ Database schema not found')
        console.error(`   Error: ${error.message}`)
        console.error('')
        console.error('💡 The database connection is working, but migrations need to be applied.')
        console.error('')
        console.error('   To fix this, run one of the following:')
        console.error('   1. Using Supabase CLI:')
        console.error('      npm run db:link    # Link your project first')
        console.error('      npm run db:migrate # Push migrations')
        console.error('')
        console.error('   2. Using Supabase Dashboard:')
        console.error('      - Go to your Supabase project dashboard')
        console.error('      - Navigate to SQL Editor')
        console.error('      - Run the migration file: supabase/migrations/20240101000000_initial_schema.sql')
        console.error('')
        process.exit(1)
      }

      // Other database errors
      console.error('❌ Database connection failed:')
      console.error(`   Error: ${error.message}`)
      console.error(`   Code: ${error.code || 'N/A'}`)
      process.exit(1)
    }

    console.log('✅ Database connection confirmed')
    if (data) {
      console.log(`   Found ${data.length} row(s) in subreddits table`)
    }
  } catch (error) {
    console.error('❌ Database validation failed:')
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }
}

// Run validation
validateDatabase()

