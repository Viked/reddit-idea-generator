import { RedditPost } from '@/services/reddit-service'

export interface PainPoint {
  text: string
  score: number
  source_ids: string[] // Array of Reddit post IDs that contributed to this pain point
}

export interface GeneratedIdea {
  title: string
  pitch: string
  target_audience: string
  score: number
}

export interface ILLMService {
  analyzePainPoints(posts: RedditPost[]): Promise<PainPoint[]>
  generateIdea(painPoint: string): Promise<GeneratedIdea>
}


