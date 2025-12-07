import { IRedditSource, LiveRedditSource, MockRedditSource } from './reddit-service'
import { OpenAILLMService, MockLLMService } from './llm-service'
import { ILLMService } from '@/types/llm'
import { serverEnv } from '@/lib/env'

/**
 * Factory function to get the appropriate Reddit source based on MOCK_MODE
 */
export function getRedditSource(): IRedditSource {
  if (typeof window !== 'undefined') {
    throw new Error('getRedditSource() can only be used on the server side')
  }

  const isMockMode = serverEnv?.MOCK_MODE === true || process.env.MOCK_MODE === 'true'

  if (isMockMode) {
    return new MockRedditSource()
  }

  return new LiveRedditSource()
}

/**
 * Factory function to get the appropriate LLM service based on MOCK_MODE or API key availability
 */
export function getLLMService(): ILLMService {
  if (typeof window !== 'undefined') {
    throw new Error('getLLMService() can only be used on the server side')
  }

  const isMockMode =
    serverEnv?.MOCK_MODE === true || process.env.MOCK_MODE === 'true'
  const hasApiKey = !!serverEnv?.OPENAI_API_KEY

  // Return MockLLMService if MOCK_MODE is enabled OR if API key is missing
  if (isMockMode || !hasApiKey) {
    return new MockLLMService()
  }

  return new OpenAILLMService()
}

