import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
config();
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
const sql = "ALTER TABLE IF EXISTS public.news_items ADD COLUMN IF NOT EXISTS coverage_count integer DEFAULT 1;";
const { error } = await s.rpc("exec_sql", { sql });
if (error) console.error("Error:", error.message); else console.log("Migration OK");
