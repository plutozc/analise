-- Add coverage_count column to track multi-source story coverage
ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS coverage_count integer DEFAULT 1;
