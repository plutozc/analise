import { config } from "dotenv";
import pg from "pg";
config();
const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL || `postgresql://postgres.dguytizohmoezsowfcis:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
});
try {
  await pool.query("ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS coverage_count integer DEFAULT 1;");
  console.log("Migration OK");
} catch(e) { console.error("Migration failed:", e.message); }
await pool.end();
