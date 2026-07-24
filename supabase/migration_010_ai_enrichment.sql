ALTER TABLE papers ADD COLUMN IF NOT EXISTS ai_enrichment jsonb DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_papers_ai_enrichment ON papers ((ai_enrichment IS NOT NULL)) WHERE ai_enrichment IS NOT NULL;
