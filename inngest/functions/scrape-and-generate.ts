import { inngest } from '../client'
import { getRedditSource } from '@/services'
import { getLLMService } from '@/services'
import { createAdminClient } from '@/lib/supabase'
import { Database } from '@/types/database'
import { sendIdeaDigest } from '@/lib/email-digest'

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

    // Step 0: Ensure subreddit exists in database (don't update last_scraped_at yet)
    await step.run('ensure-subreddit', async () => {
      const supabase = createAdminClient()
      const normalizedName = subreddit.toLowerCase()
      
      // Check if subreddit exists, create if it doesn't (but don't update last_scraped_at yet)
      const { data: existing, error: checkError } = await supabase
        .from('subreddits')
        .select('id, name, last_scraped_at')
        .eq('name', normalizedName)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine, other errors are problems
        console.error(`Error checking subreddit "${normalizedName}":`, checkError)
      }

      if (!existing) {
        // Create subreddit record without last_scraped_at (will be set at the end)
        const insertData = {
          name: normalizedName,
          last_scraped_at: null,
          updated_at: new Date().toISOString(),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('subreddits') as any).insert(insertData)
        if (insertError) {
          console.error(`Failed to create subreddit "${normalizedName}":`, insertError)
        } else {
          console.log(`✅ Created subreddit record for "${normalizedName}"`)
        }
      } else {
        const existingData = existing as { id: string; name: string; last_scraped_at: string | null }
        console.log(`✅ Subreddit "${normalizedName}" exists, current last_scraped_at: ${existingData.last_scraped_at}`)
      }
    })

    // Step 1: Fetch rising posts from Reddit
    const posts = await step.run('fetch-posts', async () => {
      const redditSource = getRedditSource()
      const fetchedPosts = await redditSource.fetchRisingPosts(subreddit)
      
      if (fetchedPosts.length === 0) {
        console.warn(`No posts fetched for subreddit "${subreddit}". Workflow will skip analysis and ideation.`)
      }
      
      return fetchedPosts
    })

    // Early return if no posts found - but still update timestamp
    if (posts.length === 0) {
      // Update last_scraped_at even if no posts found
      await step.run('update-sync-timestamp-empty', async () => {
        const supabase = createAdminClient()
        const normalizedName = subreddit.toLowerCase()
        const now = new Date().toISOString()
        
        const updateData = {
          last_scraped_at: now,
          updated_at: now,
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('subreddits') as any)
          .update(updateData)
          .eq('name', normalizedName)

        if (error) {
          console.error(`Failed to update last_scraped_at for "${normalizedName}":`, error)
        }
      })

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
          source_ids: painPoint.source_ids || [], // Include source IDs from analysis
        })
      }

      return generatedIdeas
    })

    // Step 4: Persist ideas to database
    const insertedCount = await step.run('persist-ideas', async () => {
      const supabase = createAdminClient()

      const ideasToInsert: Database['public']['Tables']['ideas']['Insert'][] =
        ideas.map((idea) => ({
          title: idea.title,
          pitch: idea.pitch,
          pain_point: idea.pain_point,
          score: idea.score,
          source_ids: (idea as { source_ids?: string[] }).source_ids || [],
        }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('ideas').insert(ideasToInsert as any)

      if (error) {
        throw new Error(`Failed to insert ideas: ${error.message}`)
      }

      return { inserted: ideasToInsert.length }
    })

    // Step 5: Send digest emails (only if new ideas were created)
    let emailResult = { emailsSent: 0, emailsFailed: 0 }
    if (insertedCount.inserted > 0) {
      emailResult = await step.run('send-digest', async () => {
        const supabase = createAdminClient()

        // Fetch the newly inserted ideas from database
        const { data: newIdeas, error: ideasError } = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(insertedCount.inserted)

        if (ideasError) {
          throw new Error(`Failed to fetch new ideas: ${ideasError.message}`)
        }

        if (!newIdeas || newIdeas.length === 0) {
          return { emailsSent: 0, emailsFailed: 0 }
        }

        // Fetch all subscribed users
        const { data: allUsers, error: usersError } = await supabase
          .from('users')
          .select('*')

        if (usersError) {
          throw new Error(`Failed to fetch users: ${usersError.message}`)
        }

        if (!allUsers || allUsers.length === 0) {
          return { emailsSent: 0, emailsFailed: 0 }
        }

        // Send digest emails
        const result = await sendIdeaDigest(allUsers, newIdeas)
        return result
      })
    }

    // Step 6: Update last_scraped_at AFTER all work is complete
    await step.run('update-sync-timestamp', async () => {
      const supabase = createAdminClient()
      const normalizedName = subreddit.toLowerCase()
      const now = new Date().toISOString()
      
      // Use upsert to ensure the record exists and update it
      const upsertData = {
        name: normalizedName,
        last_scraped_at: now,
        updated_at: now,
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error, data } = await (supabase.from('subreddits') as any)
        .upsert(upsertData, {
          onConflict: 'name',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error(`❌ Failed to upsert last_scraped_at for "${normalizedName}":`, error)
        // Try fallback: direct update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('subreddits') as any)
          .update({ last_scraped_at: now, updated_at: now })
          .eq('name', normalizedName)
        
        if (updateError) {
          console.error(`❌ Fallback update also failed for "${normalizedName}":`, updateError)
        } else {
          console.log(`✅ Updated last_scraped_at for "${normalizedName}" to ${now} (via fallback)`)
        }
      } else {
        console.log(`✅ Upserted last_scraped_at for "${normalizedName}" to ${now}`, data?.[0] ? `(id: ${data[0].id})` : '')
      }
    })

    return {
      subreddit,
      postsFetched: posts.length,
      painPointsFound: painPoints.length,
      ideasGenerated: ideas.length,
      ideasInserted: insertedCount.inserted,
      emailsSent: emailResult.emailsSent,
      emailsFailed: emailResult.emailsFailed,
    }
  }
)
