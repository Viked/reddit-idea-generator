import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { statSync } from 'fs'
import { join } from 'path'
import { RedditPost } from '../services/reddit-service'

// Load .env.local file BEFORE any imports that use @/lib/env
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
// Note: Not using Database generic to avoid type inference issues in scripts
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test implementation of LiveRedditSource logic to avoid env import issues
class TestLiveRedditSource {
  private readonly CACHE_TTL_HOURS = 12
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any // Using any to avoid type issues in test script

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  async fetchRisingPosts(subreddit: string): Promise<RedditPost[]> {
    // Step 1: Check DB for fresh cache (within 12 hours)
    const cacheCutoff = new Date()
    cacheCutoff.setHours(cacheCutoff.getHours() - this.CACHE_TTL_HOURS)

    const { data: cachedPosts, error: cacheError } = await this.supabase
      .from('raw_posts')
      .select('*')
      .eq('subreddit', subreddit)
      .gte('created_at', cacheCutoff.toISOString())
      .order('created_at', { ascending: false })

    // Cache Hit: Return mapped data immediately
    if (!cacheError && cachedPosts && cachedPosts.length > 0) {
      return this.mapToRedditPosts(cachedPosts)
    }

    // Cache Miss: Try to fetch from Reddit API
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/rising.json`,
        {
          headers: {
            'User-Agent': 'RedditIdeaGenerator/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Reddit API returned ${response.status}`)
      }

      const json = await response.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const posts = json.data.children.map((child: { data: any }) => child.data)

      // Upsert posts into database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postsToUpsert = posts.map((post: any) => ({
        reddit_id: post.id,
        title: post.title,
        selftext: post.selftext || null,
        subreddit: post.subreddit,
        data: post as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
      }))

      // Use upsert to handle duplicates
      const { error: upsertError } = await this.supabase
        .from('raw_posts')
        .upsert(postsToUpsert)

      if (upsertError) {
        console.error('Error upserting posts:', upsertError)
      }

      // Return mapped data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        selftext: post.selftext || null,
        subreddit: post.subreddit,
        reddit_id: post.id,
        created_at: new Date().toISOString(),
        data: post as unknown as Record<string, unknown>,
      }))
    } catch (error) {
      // Fallback: Query DB for any posts for this subreddit (ignore time limit)
      const fetchError = error instanceof Error ? error.message : String(error)
      console.warn('Reddit API fetch failed, falling back to stale data:', fetchError)

      try {
        const { data: stalePosts, error: staleError } = await this.supabase
          .from('raw_posts')
          .select('*')
          .eq('subreddit', subreddit)
          .order('created_at', { ascending: false })
          .limit(50)

        if (staleError) {
          const dbErrorMsg = staleError instanceof Error 
            ? staleError.message 
            : typeof staleError === 'object' 
              ? JSON.stringify(staleError)
              : String(staleError)
          throw new Error(
            `Failed to fetch from Reddit API and database. API Error: ${fetchError}. DB Error: ${dbErrorMsg}`
          )
        }

        if (!stalePosts || stalePosts.length === 0) {
          throw new Error(
            `No posts found for subreddit "${subreddit}" in cache or database. Original API error: ${fetchError}`
          )
        }

        // Return stale data
        return this.mapToRedditPosts(stalePosts)
      } catch (dbError) {
        // If database query also fails, throw with both errors
        const dbErrorMsg = dbError instanceof Error 
          ? dbError.message 
          : String(dbError)
        throw new Error(
          `Failed to fetch from Reddit API and database. API Error: ${fetchError}. DB Error: ${dbErrorMsg}`
        )
      }
    }
  }

  private mapToRedditPosts(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbPosts: any[]
  ): RedditPost[] {
    return dbPosts.map((post) => ({
      id: post.id,
      title: post.title,
      selftext: post.selftext,
      subreddit: post.subreddit || '',
      reddit_id: post.reddit_id,
      created_at: post.created_at,
      data: (post.data as Record<string, unknown>) || undefined,
    }))
  }
}

async function test1CachePriority() {
  console.log('🧪 Test 1: Cache Priority')
  console.log('  Inserting dummy record with title "CACHE_HIT_TEST"...')

  const testSubreddit = 'test_subreddit'
  const testRedditId = `test_${Date.now()}`

  // Insert a dummy record
  const { error: insertError } = await supabase
    .from('raw_posts')
    .insert({
      reddit_id: testRedditId,
      title: 'CACHE_HIT_TEST',
      selftext: 'Test content',
      subreddit: testSubreddit,
      data: { test: true },
      created_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

  if (insertError) {
    console.error('  ❌ Failed to insert test record:', insertError)
    return false
  }

  // Wait a moment for the insert to be visible
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Call TestLiveRedditSource
  const source = new TestLiveRedditSource(supabase)
  const posts = await source.fetchRisingPosts(testSubreddit)

  // Check if the test record is in the results
  const found = posts.some((post) => post.title === 'CACHE_HIT_TEST')

  // Cleanup
  await supabase.from('raw_posts').delete().eq('reddit_id', testRedditId)

  if (found) {
    console.log('  ✅ Cache hit test passed - found CACHE_HIT_TEST in results')
    return true
  } else {
    console.log('  ❌ Cache hit test failed - CACHE_HIT_TEST not found in results')
    return false
  }
}

async function test2ApiFallback() {
  console.log('🧪 Test 2: API Fallback to Stale Data')
  console.log('  Setting up stale data and mocking fetch to fail...')

  const testSubreddit = 'fallback_test'
  const testRedditId = `fallback_${Date.now()}`

  // Insert stale data (older than 12 hours)
  const staleDate = new Date()
  staleDate.setHours(staleDate.getHours() - 13) // 13 hours ago

  const { error: insertError } = await supabase
    .from('raw_posts')
    .insert({
      reddit_id: testRedditId,
      title: 'STALE_DATA_TEST',
      selftext: 'Stale content',
      subreddit: testSubreddit,
      data: { stale: true },
      created_at: staleDate.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

  if (insertError) {
    console.error('  ❌ Failed to insert stale test record:', insertError)
    return false
  }

  // Wait a moment for the insert to be visible
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Verify the stale data was inserted correctly
  const { data: verifyData, error: verifyError } = await supabase
    .from('raw_posts')
    .select('*')
    .eq('subreddit', testSubreddit)
    .eq('title', 'STALE_DATA_TEST')

  if (verifyError || !verifyData || verifyData.length === 0) {
    console.error('  ❌ Failed to verify stale test record:', verifyError)
    await supabase.from('raw_posts').delete().eq('reddit_id', testRedditId)
    return false
  }

  // Mock global.fetch to throw an error only for Reddit API calls
  const originalFetch = global.fetch
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    // Only mock Reddit API calls, let other fetches (like Supabase) work normally
    if (url.includes('reddit.com')) {
      throw new Error('Network error: Failed to fetch')
    }
    // For all other URLs, use the original fetch
    return originalFetch(input, init)
  }

  try {
    const source = new TestLiveRedditSource(supabase)
    const posts = await source.fetchRisingPosts(testSubreddit)

    // Should return stale data instead of throwing
    const found = posts.some((post) => post.title === 'STALE_DATA_TEST')

    // Cleanup
    await supabase.from('raw_posts').delete().eq('reddit_id', testRedditId)

    if (found) {
      console.log('  ✅ API fallback test passed - returned stale data')
      return true
    } else {
      console.log('  ❌ API fallback test failed - stale data not found')
      return false
    }
  } catch (error) {
    // Cleanup
    await supabase.from('raw_posts').delete().eq('reddit_id', testRedditId)
    console.error('  ❌ API fallback test failed - threw error:', error)
    return false
  } finally {
    // Restore original fetch
    global.fetch = originalFetch
  }
}

async function test3FileWrite() {
  console.log('🧪 Test 3: File Write (sync-mocks.ts)')
  console.log('  Running sync-mocks.ts programmatically...')

  const mockFilePath = join(process.cwd(), 'data', 'mock-reddit.json')

  // Get initial file stats if it exists
  let initialMtime: Date | null = null
  try {
    const stats = statSync(mockFilePath)
    initialMtime = stats.mtime
  } catch {
    // File doesn't exist yet, that's fine
  }

  // Run sync-mocks.ts
  try {
    execSync('npx tsx scripts/sync-mocks.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
  } catch (error) {
    console.error('  ❌ Failed to run sync-mocks.ts:', error)
    return false
  }

  // Verify file was updated
  try {
    const stats = statSync(mockFilePath)
    const newMtime = stats.mtime

    if (initialMtime === null || newMtime > initialMtime) {
      console.log('  ✅ File write test passed - mock-reddit.json was updated')
      return true
    } else {
      console.log('  ❌ File write test failed - file was not updated')
      return false
    }
  } catch (error) {
    console.error('  ❌ File write test failed - file not found:', error)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Reddit Ingestion Validation Tests\n')

  const results = {
    test1: false,
    test2: false,
    test3: false,
  }

  try {
    results.test1 = await test1CachePriority()
    console.log('')
  } catch (error) {
    console.error('  ❌ Test 1 crashed:', error)
  }

  try {
    results.test2 = await test2ApiFallback()
    console.log('')
  } catch (error) {
    console.error('  ❌ Test 2 crashed:', error)
  }

  try {
    results.test3 = await test3FileWrite()
    console.log('')
  } catch (error) {
    console.error('  ❌ Test 3 crashed:', error)
  }

  // Summary
  console.log('📊 Test Summary:')
  console.log(`  Test 1 (Cache Priority): ${results.test1 ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Test 2 (API Fallback): ${results.test2 ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Test 3 (File Write): ${results.test3 ? '✅ PASS' : '❌ FAIL'}`)

  const allPassed = results.test1 && results.test2 && results.test3

  if (allPassed) {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Some tests failed')
    process.exit(1)
  }
}

// Run all tests
runAllTests()

