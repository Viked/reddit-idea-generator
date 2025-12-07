export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subreddits: {
        Row: {
          id: string
          name: string
          category: string | null
          last_scraped_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          last_scraped_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          last_scraped_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      raw_posts: {
        Row: {
          id: string
          reddit_id: string
          title: string
          selftext: string | null
          subreddit_id: string | null
          subreddit: string | null
          data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reddit_id: string
          title: string
          selftext?: string | null
          subreddit_id?: string | null
          subreddit?: string | null
          data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reddit_id?: string
          title?: string
          selftext?: string | null
          subreddit_id?: string | null
          subreddit?: string | null
          data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          title: string
          pitch: string
          pain_point: string
          score: number
          source_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          pitch: string
          pain_point: string
          score: number
          source_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          pitch?: string
          pain_point?: string
          score?: number
          source_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          subscription_topics: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          subscription_topics?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscription_topics?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

