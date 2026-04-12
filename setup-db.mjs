import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log("Creating expenses table...");
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✅ Table created!");
  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(username)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(created_at DESC)`;
  console.log("✅ Indexes created!");
}

setup().catch(e => { console.error("❌ Error:", e); process.exit(1); });
