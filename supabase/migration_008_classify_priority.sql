-- Add classify_priority to papers for deferred AI classification
-- high: classify immediately during sync
-- medium: classify via hourly batch task
-- low: skip AI, use keyword-based topics only
ALTER TABLE papers ADD COLUMN IF NOT EXISTS classify_priority text DEFAULT NULL;

-- Index for the classify-medium task query
CREATE INDEX IF NOT EXISTS idx_papers_classify_medium
  ON papers (created_at)
  WHERE classify_priority = 'medium' AND ai_classified = false;
