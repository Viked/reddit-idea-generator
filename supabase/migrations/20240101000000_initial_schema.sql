-- Create subreddits table
CREATE TABLE IF NOT EXISTS subreddits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create raw_posts table
CREATE TABLE IF NOT EXISTS raw_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reddit_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  selftext TEXT,
  subreddit_id UUID NOT NULL REFERENCES subreddits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  pain_point TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscription_topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_raw_posts_subreddit_id ON raw_posts(subreddit_id);
CREATE INDEX IF NOT EXISTS idx_raw_posts_reddit_id ON raw_posts(reddit_id);
CREATE INDEX IF NOT EXISTS idx_ideas_score ON ideas(score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subreddits_name ON subreddits(name);

-- Enable Row Level Security on all tables
ALTER TABLE subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subreddits
-- Service role only for INSERT/UPDATE
CREATE POLICY "Service role can insert subreddits"
  ON subreddits FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update subreddits"
  ON subreddits FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read for subreddits
CREATE POLICY "Public can read subreddits"
  ON subreddits FOR SELECT
  TO public
  USING (true);

-- RLS Policies for raw_posts
-- Service role only for INSERT/UPDATE
CREATE POLICY "Service role can insert raw_posts"
  ON raw_posts FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update raw_posts"
  ON raw_posts FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read for raw_posts
CREATE POLICY "Public can read raw_posts"
  ON raw_posts FOR SELECT
  TO public
  USING (true);

-- RLS Policies for ideas
-- Public read for ideas
CREATE POLICY "Public can read ideas"
  ON ideas FOR SELECT
  TO public
  USING (true);

-- Service role only for INSERT/UPDATE
CREATE POLICY "Service role can insert ideas"
  ON ideas FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update ideas"
  ON ideas FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for users
-- Users can only read/update their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can insert/update users
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update users"
  ON users FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

