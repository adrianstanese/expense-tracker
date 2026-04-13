import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

const CATEGORIES = [
  "Food & Dining","Groceries","Transport","Accommodation","Shopping",
  "Entertainment","Health & Pharmacy","Bills & Utilities","Travel",
  "Coffee & Drinks","Gifts","Personal Care","Education","Subscriptions","Other"
];

const rateCache: Record<string, { rate: number; at: number }> = {};
const RATE_TTL = 30 * 60 * 1000;

async function getRate(currency: string): Promise<number> {
  if (currency === "EUR") return 1;
  const cached = rateCache[currency];
  if (cached && Date.now() - cached.at < RATE_TTL) return cached.rate;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${currency}&to=EUR`, { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json();
    const rate = data?.rates?.EUR;
    if (rate) { rateCache[currency] = { rate, at: Date.now() }; return rate; }
    return cached?.rate || 1;
  } catch { return cached?.rate || 1; }
}

async function categorize(desc: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return "Other";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 20, messages: [{ role: "user", content: `Categorize this expense into exactly one: ${CATEGORIES.join(", ")}.\n\nExpense: "${desc}"\n\nRespond with ONLY the category name.` }] }),
    });
    const data = await res.json();
    const cat = data?.content?.[0]?.text?.trim();
    if (cat && CATEGORIES.includes(cat)) return cat;
    return CATEGORIES.find(c => cat?.toLowerCase().includes(c.toLowerCase())) || "Other";
  } catch { return "Other"; }
}

export async function GET(req: NextRequest) {
  try {
    const gid = req.nextUrl.searchParams.get("gid");
    if (!gid) return NextResponse.json({ error: "Missing group id" }, { status: 400 });
    const action = req.nextUrl.searchParams.get("action");

    if (action === "insights") {
      const rows = await sql`SELECT username, amount_eur, category, trip, scope, created_at FROM expenses WHERE group_id=${gid} ORDER BY created_at DESC LIMIT 200`;
      if (rows.length < 3) return NextResponse.json({ insight: "Add more expenses to get AI insights." });
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return NextResponse.json({ insight: "API key not configured." });

      // Get group member names
      const grp = await sql`SELECT name, members FROM groups WHERE id=${gid}`;
      const memberNames = grp.length > 0 ? grp[0].members.join(", ") : "the group members";
      const groupName = grp.length > 0 ? grp[0].name : "the group";

      const summary = rows.map((r: any) => `${r.username}|€${r.amount_eur}|${r.category}|${r.scope||"shared"}|${r.trip||"-"}|${new Date(r.created_at).toLocaleDateString()}`).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 300, messages: [{ role: "user", content: `You are a friendly financial advisor for a group called "${groupName}" with members: ${memberNames}. Analyze their recent expenses and give 3-4 short, specific, actionable insights. Be warm, use their names. Emoji sparingly. Under 200 words.\n\nExpenses:\n${summary}` }] }),
      });
      const data = await res.json();
      return NextResponse.json({ insight: data?.content?.[0]?.text || "Could not generate insights." });
    }

    if (action === "export") {
      const rows = await sql`SELECT username, amount, currency, amount_eur, description, category, trip, scope, created_at FROM expenses WHERE group_id=${gid} ORDER BY created_at DESC`;
      let csv = "Date,Time,User,Amount,Currency,EUR,Description,Category,Trip,Scope\n";
      rows.forEach((r: any) => {
        const d = new Date(r.created_at);
        csv += `${d.toLocaleDateString("en-GB")},${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })},${r.username},${r.amount},${r.currency||"EUR"},${r.amount_eur},"${(r.description||"").replace(/"/g, '""')}",${r.category},${r.trip||""},${r.scope||"shared"}\n`;
      });
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=expenses.csv" } });
    }

    const rows = await sql`SELECT id, group_id, username, amount, currency, amount_eur, description, category, trip, scope, comments, reactions, created_at FROM expenses WHERE group_id=${gid} ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, group_id, username, amount, description, currency = "EUR", trip = "", scope = "shared", created_at } = await req.json();
    if (!id || !group_id || !username || !amount || !description) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const category = await categorize(description);
    // Fixed RON rate: 5.1, otherwise use live rate
    const rate = currency === "RON" ? (1 / 5.1) : await getRate(currency);
    const amountEur = Math.round(amount * rate * 100) / 100;
    if (created_at) {
      await sql`INSERT INTO expenses (id, group_id, username, amount, currency, amount_eur, description, category, trip, scope, created_at)
        VALUES (${id}, ${group_id}, ${username}, ${amount}, ${currency}, ${amountEur}, ${description}, ${category}, ${trip}, ${scope}, ${created_at})`;
    } else {
      await sql`INSERT INTO expenses (id, group_id, username, amount, currency, amount_eur, description, category, trip, scope)
        VALUES (${id}, ${group_id}, ${username}, ${amount}, ${currency}, ${amountEur}, ${description}, ${category}, ${trip}, ${scope})`;
    }
    return NextResponse.json({ ok: true, category, amount_eur: amountEur });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, amount, description, currency, trip, scope } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const existing = await sql`SELECT id FROM expenses WHERE id=${id}`;
    if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const category = description ? await categorize(description) : undefined;
    const cur = currency || "EUR";
    const rate = await getRate(cur);
    const amountEur = amount ? Math.round(amount * rate * 100) / 100 : undefined;
    await sql`UPDATE expenses SET
      amount=COALESCE(${amount||null},amount), currency=COALESCE(${currency||null},currency),
      amount_eur=COALESCE(${amountEur||null},amount_eur), description=COALESCE(${description||null},description),
      category=COALESCE(${category||null},category), trip=COALESCE(${trip!==undefined?trip:null},trip),
      scope=COALESCE(${scope||null},scope) WHERE id=${id}`;
    return NextResponse.json({ ok: true, category, amount_eur: amountEur });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username } = body;
    if (!id || !username) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Reaction toggle
    if (body.reaction) {
      const rows = await sql`SELECT reactions FROM expenses WHERE id=${id}`;
      if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const reactions: Record<string, string[]> = JSON.parse(rows[0].reactions || "{}");
      const emoji = body.reaction;
      if (!reactions[emoji]) reactions[emoji] = [];
      const idx = reactions[emoji].indexOf(username);
      if (idx >= 0) reactions[emoji].splice(idx, 1); // toggle off
      else reactions[emoji].push(username); // toggle on
      if (reactions[emoji].length === 0) delete reactions[emoji];
      await sql`UPDATE expenses SET reactions=${JSON.stringify(reactions)} WHERE id=${id}`;
      return NextResponse.json({ ok: true, reactions });
    }

    // Comment
    if (body.comment) {
      const rows = await sql`SELECT comments FROM expenses WHERE id=${id}`;
      if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const arr = JSON.parse(rows[0].comments || "[]");
      arr.push({ user: username, text: body.comment, at: new Date().toISOString() });
      await sql`UPDATE expenses SET comments=${JSON.stringify(arr)} WHERE id=${id}`;
      return NextResponse.json({ ok: true, comments: arr });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, group_id } = await req.json();
    if (id === "__ALL__" && group_id) await sql`DELETE FROM expenses WHERE group_id=${group_id}`;
    else if (id) await sql`DELETE FROM expenses WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
