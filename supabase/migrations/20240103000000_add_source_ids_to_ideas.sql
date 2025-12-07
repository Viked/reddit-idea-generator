-- Add source_ids column to ideas table to store Reddit post IDs/URLs
-- This column stores an array of Reddit post IDs that inspired each idea
ALTER TABLE ideas 
  ADD COLUMN IF NOT EXISTS source_ids TEXT[] DEFAULT '{}';

-- Create index on source_ids for better query performance (using GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_ideas_source_ids ON ideas USING GIN (source_ids);

-- Add comment to document the column purpose
COMMENT ON COLUMN ideas.source_ids IS 'Array of Reddit post IDs (reddit_id) that inspired this idea';

