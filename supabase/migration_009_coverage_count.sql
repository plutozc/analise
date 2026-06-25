-- Add coverage_count to news_items for cross-source dedup boosting
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS coverage_count integer DEFAULT 1;

-- RPC to atomically increment coverage_count
CREATE OR REPLACE FUNCTION increment_coverage_count(row_id uuid, inc integer)
RETURNS void AS $$
  UPDATE news_items SET coverage_count = coverage_count + inc WHERE id = row_id;
$$ LANGUAGE sql;
