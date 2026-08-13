-- News bulletin system for data communications & AI infrastructure industry updates
CREATE TABLE IF NOT EXISTS news_bulletins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  analysis text NOT NULL,
  recommendation text NOT NULL,
  source_news_ids uuid[] DEFAULT '{}',
  bulletin_type text NOT NULL DEFAULT 'aggregate',  -- 'aggregate' or 'urgent'
  published_date date NOT NULL DEFAULT CURRENT_DATE,
  word_count int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bulletins_date ON news_bulletins (published_date DESC);
CREATE INDEX IF NOT EXISTS idx_bulletins_type ON news_bulletins (bulletin_type);
