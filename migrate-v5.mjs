import { neon } from "@neondatabase/serverless";
import "dotenv/config";
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("🚀 V5 Migration — Multi-group expense tracker\n");

  // Drop old table (starting fresh as requested)
  await sql`DROP TABLE IF EXISTS expenses CASCADE`;
  console.log("✅ Old expenses table dropped");

  // Groups table
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      members TEXT[] NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✅ Groups table created");

  // Expenses table with group reference
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT DEFAULT 'EUR',
      amount_eur NUMERIC(10,2),
      description TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      trip TEXT DEFAULT '',
      scope TEXT DEFAULT 'shared',
      comments TEXT DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✅ Expenses table created");

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_exp_group ON expenses(group_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exp_user ON expenses(username)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exp_date ON expenses(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_groups_id ON groups(id)`;
  console.log("✅ Indexes created");

  console.log("\n🎉 V5 migration complete!");
}

migrate().catch(e => { console.error("❌", e); process.exit(1); });
