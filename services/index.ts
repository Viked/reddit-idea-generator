import { IRedditSource, LiveRedditSource, MockRedditSource } from './reddit-service'
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

