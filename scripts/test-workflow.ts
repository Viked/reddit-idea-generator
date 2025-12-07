import { config } from 'dotenv'
import { resolve } from 'path'
import { GeneratedIdea } from '../types/llm'

// Force MOCK_MODE=true before loading env
process.env.MOCK_MODE = 'true'

// Load .env.local file BEFORE any imports that use @/lib/env
config({ path: resolve(process.cwd(), '.env.local') })

/**
 * Integration test for the full workflow pipeline
 * Validates the logic chain without running the full Inngest server
 */
async function testWorkflow() {
  // Dynamic imports after env is loaded
  const { getRedditSource } = await import('../services')
  const { getLLMService } = await import('../services')
  console.log('🔍 Testing Workflow Pipeline')
  console.log('='.repeat(50))
  console.log('⚠️  MOCK_MODE is forced to true for this test\n')

  // Use a subreddit that exists in mock data
  const subreddit = 'fallback_test' // Test subreddit (exists in mock data)

  try {
    // Step 1: Fetch posts
    console.log('📥 Step 1: Fetching Reddit posts...')
    const redditSource = getRedditSource()
    const posts = await redditSource.fetchRisingPosts(subreddit)

    if (!Array.isArray(posts)) {
      throw new Error('Expected posts to be an array')
    }

    if (posts.length === 0) {
      throw new Error('No posts fetched')
    }

    console.log(`✅ Fetched ${posts.length} post(s)`)
    console.log(`   First post: "${posts[0].title}"`)
    console.log(`   Subreddit: ${posts[0].subreddit}\n`)

    // Step 2: Analyze pain points
    console.log('🔍 Step 2: Analyzing pain points...')
    const llmService = getLLMService()
    const painPoints = await llmService.analyzePainPoints(posts)

    if (!Array.isArray(painPoints)) {
      throw new Error('Expected painPoints to be an array')
    }

    if (painPoints.length === 0) {
      throw new Error('No pain points found')
    }

    console.log(`✅ Found ${painPoints.length} pain point(s)`)
    painPoints.forEach((pp, idx) => {
      console.log(
        `   ${idx + 1}. "${pp.text.substring(0, 60)}..." (score: ${pp.score})`
      )
    })
    console.log()

    // Step 3: Generate ideas
    console.log('💡 Step 3: Generating ideas...')
    const ideas: (GeneratedIdea & { pain_point: string })[] = []

    for (const painPoint of painPoints) {
      const idea = await llmService.generateIdea(painPoint.text)
      ideas.push({
        ...idea,
        pain_point: painPoint.text,
      })
    }

    if (ideas.length === 0) {
      throw new Error('No ideas generated')
    }

    console.log(`✅ Generated ${ideas.length} idea(s)`)
    ideas.forEach((idea, idx) => {
      console.log(`   ${idx + 1}. "${idea.title}" (score: ${idea.score})`)
      console.log(`      Pitch: ${idea.pitch.substring(0, 80)}...`)
    })
    console.log()

    // Verification: Assert valid Idea objects
    console.log('✅ Verification: Validating idea structure...')
    for (const idea of ideas) {
      if (!idea.title || typeof idea.title !== 'string') {
        throw new Error('Invalid idea: title is required and must be a string')
      }

      if (!idea.pitch || typeof idea.pitch !== 'string') {
        throw new Error('Invalid idea: pitch is required and must be a string')
      }

      if (!idea.pain_point || typeof idea.pain_point !== 'string') {
        throw new Error(
          'Invalid idea: pain_point is required and must be a string'
        )
      }

      if (typeof idea.score !== 'number') {
        throw new Error('Invalid idea: score is required and must be a number')
      }

      if (idea.score < 0 || idea.score > 100) {
        throw new Error(
          `Invalid idea: score must be between 0 and 100, got ${idea.score}`
        )
      }
    }

    console.log('✅ All ideas have valid structure')
    console.log('   ✓ title: string')
    console.log('   ✓ pitch: string')
    console.log('   ✓ pain_point: string')
    console.log('   ✓ score: number (0-100)')
    console.log()

    // Summary
    console.log('='.repeat(50))
    console.log('✅ Workflow test completed successfully!')
    console.log(`   Posts fetched: ${posts.length}`)
    console.log(`   Pain points found: ${painPoints.length}`)
    console.log(`   Ideas generated: ${ideas.length}`)
  } catch (error) {
    console.error('\n❌ Workflow test failed:')
    console.error(
      `   ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run test
testWorkflow()
