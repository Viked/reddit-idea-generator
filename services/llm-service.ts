import OpenAI from 'openai'
import { serverEnv } from '@/lib/env'
import { RedditPost } from './reddit-service'
import {
  ILLMService,
  PainPoint,
  GeneratedIdea,
} from '@/types/llm'
import {
  SYSTEM_PROMPT_ANALYZE,
  SYSTEM_PROMPT_IDEATE,
} from '@/config/prompts'

/**
 * OpenAI LLM Service implementation
 * Uses OpenAI API with json_object response format
 */
export class OpenAILLMService implements ILLMService {
  private client: OpenAI

  constructor() {
    if (typeof window !== 'undefined') {
      throw new Error('OpenAILLMService can only be used on the server side')
    }

    const apiKey = serverEnv?.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required but not found in environment variables'
      )
    }

    this.client = new OpenAI({
      apiKey,
    })
  }

  async analyzePainPoints(posts: RedditPost[]): Promise<PainPoint[]> {
    // Combine posts into a single text for analysis, prefixing each with its reddit_id
    const postsText = posts
      .map(
        (post) =>
          `[REDDIT_ID: ${post.reddit_id}]\nTitle: ${post.title}\nContent: ${post.selftext || 'No content'}\nSubreddit: ${post.subreddit}`
      )
      .join('\n\n---\n\n')

    const userMessage = `Analyze the following Reddit posts and extract pain points. Each post is prefixed with its REDDIT_ID - include these IDs in the source_ids array for each pain point you identify:\n\n${postsText}`

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_ANALYZE },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const parsed = JSON.parse(content) as { pain_points: PainPoint[] }

      if (!Array.isArray(parsed.pain_points)) {
        throw new Error('Invalid response format: pain_points must be an array')
      }

      // Validate and normalize source_ids for each pain point
      return parsed.pain_points.map((pp) => ({
        ...pp,
        source_ids: Array.isArray(pp.source_ids) ? pp.source_ids : [],
      }))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse JSON response from OpenAI: ${error.message}`
        )
      }
      throw error
    }
  }

  async generateIdea(painPoint: string): Promise<GeneratedIdea> {
    const userMessage = `Generate a SaaS product idea for this pain point: ${painPoint}`

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_IDEATE },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      })

      const content = response.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const parsed = JSON.parse(content) as GeneratedIdea

      // Validate required fields
      if (
        !parsed.title ||
        !parsed.pitch ||
        !parsed.target_audience ||
        typeof parsed.score !== 'number'
      ) {
        throw new Error(
          'Invalid response format: missing required fields (title, pitch, target_audience, score)'
        )
      }

      return parsed
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse JSON response from OpenAI: ${error.message}`
        )
      }
      throw error
    }
  }
}

/**
 * Mock LLM Service implementation
 * Returns static, valid JSON data immediately for testing
 */
export class MockLLMService implements ILLMService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analyzePainPoints(_posts: RedditPost[]): Promise<PainPoint[]> {
    // Return mock pain points based on common themes
    // Use the first few posts' reddit_ids as mock source_ids
    const mockSourceIds = _posts.slice(0, 2).map((p) => p.reddit_id)
    return [
      {
        text: 'Mock pain point about slow wifi connections in remote work',
        score: 8,
        source_ids: mockSourceIds.length > 0 ? mockSourceIds : ['mock_post_1', 'mock_post_2'],
      },
      {
        text: 'Mock pain point about manual data entry being time-consuming',
        score: 7,
        source_ids: mockSourceIds.length > 1 ? mockSourceIds : ['mock_post_2', 'mock_post_3'],
      },
      {
        text: 'Mock pain point about lack of integration between tools',
        score: 6,
        source_ids: mockSourceIds.length > 0 ? [mockSourceIds[0]] : ['mock_post_3'],
      },
    ]
  }

  async generateIdea(painPoint: string): Promise<GeneratedIdea> {
    // Return a mock idea that matches the structure
    return {
      title: 'Mock SaaS Product',
      pitch: 'This is a mock product that solves the pain point: ' + painPoint,
      target_audience: 'Remote workers and digital nomads',
      score: 7,
    }
  }
}

