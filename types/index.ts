export interface Idea {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  score: number;
  url: string;
  createdAt: Date;
}

export interface UserPreference {
  id: string;
  userId: string;
  subreddits: string[];
  keywords: string[];
  minScore: number;
  createdAt: Date;
  updatedAt: Date;
}

