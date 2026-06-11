CREATE TABLE IF NOT EXISTS tech_signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text not null, -- 'surge' | 'gap' | 'emerging' | 'company-shift'
  severity integer not null default 5, -- 1-10
  title text not null,
  description text,
  topic_slug text,
  company_slugs text[] default '{}',
  evidence jsonb default '{}', -- { paper_ids: [], news_ids: [], counts: {} }
  status text not null default 'new', -- 'new' | 'acknowledged' | 'resolved'
  detected_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_tech_signals_status ON tech_signals(status);
CREATE INDEX IF NOT EXISTS idx_tech_signals_type ON tech_signals(signal_type);
ALTER TABLE tech_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read tech_signals" ON tech_signals FOR SELECT TO anon USING (true);
CREATE POLICY "anon update tech_signals" ON tech_signals FOR UPDATE TO anon USING (true);
