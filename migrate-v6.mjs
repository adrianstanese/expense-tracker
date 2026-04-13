import { neon } from "@neondatabase/serverless";
import "dotenv/config";
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("🚀 V6 Migration — Adding reactions + report support\n");

  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reactions TEXT DEFAULT '{}'`;
  await sql`UPDATE expenses SET reactions = '{}' WHERE reactions IS NULL`;
  console.log("✅ Reactions column added");

  console.log("\n🎉 V6 migration complete!");
}

migrate().catch(e => { console.error("❌", e); process.exit(1); });
