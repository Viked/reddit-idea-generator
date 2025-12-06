-- Add subreddit text column and data jsonb column to raw_posts table
ALTER TABLE raw_posts 
  ADD COLUMN IF NOT EXISTS subreddit TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB;

-- Make subreddit_id nullable to allow inserts with just subreddit text
ALTER TABLE raw_posts 
  ALTER COLUMN subreddit_id DROP NOT NULL;

-- Create index on subreddit column for better query performance
CREATE INDEX IF NOT EXISTS idx_raw_posts_subreddit ON raw_posts(subreddit);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_raw_posts_created_at ON raw_posts(created_at);

