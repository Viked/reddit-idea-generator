import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database'
import { serverEnv } from '@/lib/env'

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

    console.log(`[LiveRedditSource] Checking cache for subreddit "${subreddit}" (cache cutoff: ${cacheCutoff.toISOString()})`)

    const { data: cachedPosts, error: cacheError } = await supabase
      .from('raw_posts')
      .select('*')
      .eq('subreddit', subreddit.toLowerCase()) // Normalize to lowercase for consistency
      .gte('created_at', cacheCutoff.toISOString())
      .order('created_at', { ascending: false })

    // Cache Hit: Return mapped data immediately
    if (!cacheError && cachedPosts && cachedPosts.length > 0) {
      console.log(`[LiveRedditSource] Cache hit: Found ${cachedPosts.length} cached posts for subreddit "${subreddit}"`)
      return this.mapToRedditPosts(cachedPosts)
    }

    console.log(`[LiveRedditSource] Cache miss: No fresh cached posts found for subreddit "${subreddit}". Fetching from Reddit API...`)

    // Cache Miss: Try to fetch from Reddit API
    try {
      // Use REDDIT_USER_AGENT from env, with fallback
      const userAgent =
        serverEnv?.REDDIT_USER_AGENT || 'RedditIdeaGenerator/1.0 by /u/reddit-idea-generator'

      console.log(`Fetching posts from Reddit API for subreddit "${subreddit}" with User-Agent: ${userAgent}`)

      // Normalize subreddit name (Reddit API is case-insensitive but we want consistency)
      const normalizedSubreddit = subreddit.toLowerCase()

      // Try multiple endpoints: rising -> hot -> new (fallback if one is empty)
      const endpoints = [
        { name: 'rising', url: `https://www.reddit.com/r/${normalizedSubreddit}/rising.json?limit=25` },
        { name: 'hot', url: `https://www.reddit.com/r/${normalizedSubreddit}/hot.json?limit=25` },
        { name: 'new', url: `https://www.reddit.com/r/${normalizedSubreddit}/new.json?limit=25` },
      ]

      let posts: Array<{ id: string; title: string; selftext: string; subreddit: string; [key: string]: unknown }> = []
      let lastError: Error | null = null
      let usedEndpoint = ''

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying ${endpoint.name} endpoint for subreddit "${subreddit}"...`)
          
          const response = await fetch(endpoint.url, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/json',
            },
          })

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read response')
            console.warn(
              `Reddit API ${endpoint.name} endpoint returned ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}`
            )
            lastError = new Error(`Reddit API ${endpoint.name} returned ${response.status}: ${response.statusText}`)
            continue // Try next endpoint
          }

          const json: RedditAPIResponse = await response.json()

          // Validate response structure
          if (!json?.data?.children || !Array.isArray(json.data.children)) {
            console.warn(`Invalid Reddit API response structure from ${endpoint.name} endpoint`)
            lastError = new Error(`Invalid Reddit API response structure from ${endpoint.name}`)
            continue // Try next endpoint
          }

          const fetchedPosts = json.data.children.map((child) => child.data)

          // If we got posts, use this endpoint
          if (fetchedPosts.length > 0) {
            posts = fetchedPosts
            usedEndpoint = endpoint.name
            console.log(`Successfully fetched ${posts.length} posts from ${endpoint.name} endpoint for subreddit "${subreddit}"`)
            break
          } else {
            console.warn(`No posts found from ${endpoint.name} endpoint for subreddit "${subreddit}"`)
            // Continue to next endpoint
          }
        } catch (endpointError) {
          const errorMsg = endpointError instanceof Error ? endpointError.message : String(endpointError)
          console.warn(`Error fetching from ${endpoint.name} endpoint: ${errorMsg}`)
          lastError = endpointError instanceof Error ? endpointError : new Error(errorMsg)
          continue // Try next endpoint
        }
      }

      // If all endpoints failed or returned empty
      if (posts.length === 0) {
        const errorMsg = lastError
          ? `All Reddit API endpoints failed. Last error: ${lastError.message}`
          : `No posts returned from any endpoint for subreddit "${subreddit}"`
        console.warn(errorMsg)
        throw new Error(errorMsg)
      }

      // Upsert posts into database
      // Normalize subreddit name to lowercase for consistency
      const postsToUpsert = posts.map((post) => ({
        reddit_id: post.id,
        title: post.title,
        selftext: post.selftext || null,
        subreddit: (post.subreddit || normalizedSubreddit).toLowerCase(),
        data: post as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
      }))

      console.log(`[LiveRedditSource] Saving ${postsToUpsert.length} posts to database from ${usedEndpoint} endpoint`)

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
        .eq('subreddit', subreddit.toLowerCase()) // Normalize to lowercase
        .order('created_at', { ascending: false })
        .limit(50)

      if (staleError) {
        throw new Error(
          `Failed to fetch from Reddit API and database: ${staleError.message}`
        )
      }

      if (!stalePosts || stalePosts.length === 0) {
        // Return empty array instead of throwing - allows workflow to handle gracefully
        console.warn(
          `No posts found for subreddit "${subreddit}" in cache, API, or database. Returning empty array.`
        )
        return []
      }

      console.log(`Using ${stalePosts.length} stale posts from database for subreddit "${subreddit}"`)
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

