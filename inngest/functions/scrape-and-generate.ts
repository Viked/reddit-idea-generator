import { inngest } from '../client'
import { getRedditSource } from '@/services'
import { getLLMService } from '@/services'
import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type ScrapeEvent = {
  name: 'app/scrape'
  data: {
    subreddit: string
  }
}

/**
 * Workflow function that:
 * 1. Fetches rising posts from Reddit
 * 2. Analyzes pain points from posts
 * 3. Generates ideas for each pain point
 * 4. Persists ideas to database
 */
export const scrapeAndGenerate = inngest.createFunction(
  {
    id: 'scrape-and-generate',
    name: 'Scrape Reddit and Generate Ideas',
  },
  [
    { event: 'app/scrape' },
    { cron: '0 */6 * * *' }, // Every 6 hours
  ],
  async ({ event, step }) => {
    // Extract subreddit from event data, or use default for cron triggers or missing data
    const subreddit =
      event.name === 'app/scrape' && (event as ScrapeEvent).data?.subreddit
        ? (event as ScrapeEvent).data.subreddit
        : 'entrepreneur' // Default subreddit for cron triggers or when data is missing

    // Step 1: Fetch rising posts from Reddit
    const posts = await step.run('fetch-posts', async () => {
      const redditSource = getRedditSource()
      const fetchedPosts = await redditSource.fetchRisingPosts(subreddit)
      
      if (fetchedPosts.length === 0) {
        console.warn(`No posts fetched for subreddit "${subreddit}". Workflow will skip analysis and ideation.`)
      }
      
      return fetchedPosts
    })

    // Early return if no posts found
    if (posts.length === 0) {
      return {
        subreddit,
        postsFetched: 0,
        painPointsFound: 0,
        ideasGenerated: 0,
        message: `No posts found for subreddit "${subreddit}". Skipping analysis and ideation.`,
      }
    }

    // Step 2: Analyze pain points from posts
    const painPoints = await step.run('analyze-pain-points', async () => {
      const llmService = getLLMService()
      return await llmService.analyzePainPoints(posts)
    })

    // Step 3: Generate ideas for each pain point
    const ideas = await step.run('generate-ideas', async () => {
      const llmService = getLLMService()
      const generatedIdeas = []

      for (const painPoint of painPoints) {
        const idea = await llmService.generateIdea(painPoint.text)
        generatedIdeas.push({
          ...idea,
          pain_point: painPoint.text, // Map pain point text for database
        })
      }

      return generatedIdeas
    })

    // Step 4: Persist ideas to database
    await step.run('persist-ideas', async () => {
      const supabase = createAdminClient()

      const ideasToInsert: Database['public']['Tables']['ideas']['Insert'][] =
        ideas.map((idea) => ({
          title: idea.title,
          pitch: idea.pitch,
          pain_point: idea.pain_point,
          score: idea.score,
        }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('ideas').insert(ideasToInsert as any)

      if (error) {
        throw new Error(`Failed to insert ideas: ${error.message}`)
      }

      return { inserted: ideasToInsert.length }
    })

    return {
      subreddit,
      postsFetched: posts.length,
      painPointsFound: painPoints.length,
      ideasGenerated: ideas.length,
    }
  }
)
