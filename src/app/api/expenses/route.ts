import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

const CATEGORIES = [
  "Food & Dining", "Groceries", "Transport", "Accommodation", "Shopping",
  "Entertainment", "Health & Pharmacy", "Bills & Utilities", "Travel",
  "Coffee & Drinks", "Gifts", "Personal Care", "Education", "Subscriptions", "Other"
];

async function categorize(description: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return "Other";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 20,
        messages: [{
          role: "user",
          content: `Categorize this expense into exactly one of these categories: ${CATEGORIES.join(", ")}.\n\nExpense: "${description}"\n\nRespond with ONLY the category name, nothing else.`
        }],
      }),
    });
    const data = await res.json();
    const cat = data?.content?.[0]?.text?.trim();
    if (cat && CATEGORIES.includes(cat)) return cat;
    // fuzzy match
    const found = CATEGORIES.find(c => cat?.toLowerCase().includes(c.toLowerCase()));
    return found || "Other";
  } catch (e) {
    console.error("Categorize error:", e);
    return "Other";
  }
}

export async function GET() {
  try {
    const rows = await sql`SELECT id, username, amount, description, category, created_at FROM expenses ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, username, amount, description } = await req.json();
    if (!id || !username || !amount || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const category = await categorize(description);
    await sql`INSERT INTO expenses (id, username, amount, description, category) VALUES (${id}, ${username}, ${amount}, ${description}, ${category})`;
    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (id === "__ALL__") {
      await sql`DELETE FROM expenses`;
    } else {
      await sql`DELETE FROM expenses WHERE id = ${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
