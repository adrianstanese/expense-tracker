import { neon } from "@neondatabase/serverless";
import "dotenv/config";
const sql = neon(process.env.DATABASE_URL);
async function run() {
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other'`;
  console.log("✅ Category column added!");
}
run().catch(e => { console.error("❌", e); process.exit(1); });
