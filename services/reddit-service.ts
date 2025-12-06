import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database'

export interface RedditPost {
  id: string
  title: string
  selftext: string | null
  subreddit: string
  reddit_id: string
  created_at: string
  data?: Record<string, unknown>
}

export interface IRedditSource {
  fetchRisingPosts(subreddit: string): Promise<RedditPost[]>
}

interface RedditAPIResponse {
  data: {
    children: Array<{
      data: {
        id: string
        title: string
        selftext: string
        subreddit: string
        [key: string]: unknown
      }
    }>
  }
}

/**
 * Live Reddit source with stale-while-revalidate caching strategy
 * Implements read-through cache with 12-hour TTL and fallback to stale data
 */
export class LiveRedditSource implements IRedditSource {
  private readonly CACHE_TTL_HOURS = 12

  async fetchRisingPosts(subreddit: string): Promise<RedditPost[]> {
    const supabase = createAdminClient()

    // Step 1: Check DB for fresh cache (within 12 hours)
    const cacheCutoff = new Date()
    cacheCutoff.setHours(cacheCutoff.getHours() - this.CACHE_TTL_HOURS)

    const { data: cachedPosts, error: cacheError } = await supabase
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

      const json: RedditAPIResponse = await response.json()
      const posts = json.data.children.map((child) => child.data)

      // Upsert posts into database
      const postsToUpsert = posts.map((post) => ({
        reddit_id: post.id,
        title: post.title,
        selftext: post.selftext || null,
        subreddit: post.subreddit,
        data: post as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
      }))

      // Use upsert to handle duplicates (automatically uses unique constraint on reddit_id)
      const { error: upsertError } = await supabase
        .from('raw_posts')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(postsToUpsert as any)

      if (upsertError) {
        console.error('Error upserting posts:', upsertError)
        // Continue to return mapped data even if upsert fails
      }

      // Return mapped data
      return posts.map((post) => ({
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
      console.warn('Reddit API fetch failed, falling back to stale data:', error)

      const { data: stalePosts, error: staleError } = await supabase
        .from('raw_posts')
        .select('*')
        .eq('subreddit', subreddit)
        .order('created_at', { ascending: false })
        .limit(50)

      if (staleError) {
        throw new Error(
          `Failed to fetch from Reddit API and database: ${staleError.message}`
        )
      }

      if (!stalePosts || stalePosts.length === 0) {
        throw new Error(
          `No posts found for subreddit "${subreddit}" in cache or database`
        )
      }

      // Return stale data
      return this.mapToRedditPosts(stalePosts)
    }
  }

  private mapToRedditPosts(
    dbPosts: Database['public']['Tables']['raw_posts']['Row'][]
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

/**
 * Mock Reddit source that reads from a local JSON file
 */
export class MockRedditSource implements IRedditSource {
  async fetchRisingPosts(subreddit: string): Promise<RedditPost[]> {
    const fs = await import('fs/promises')
    const path = await import('path')

    const mockFilePath = path.join(
      process.cwd(),
      'data',
      'mock-reddit.json'
    )

    try {
      const fileContent = await fs.readFile(mockFilePath, 'utf-8')
      const data = JSON.parse(fileContent)

      // Filter by subreddit if provided, otherwise return all
      if (subreddit && Array.isArray(data)) {
        return data.filter((post) => post.subreddit === subreddit)
      }

      return Array.isArray(data) ? data : []
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `Mock file not found at ${mockFilePath}. Run sync-mocks.ts first.`
        )
      }
      throw error
    }
  }
}

