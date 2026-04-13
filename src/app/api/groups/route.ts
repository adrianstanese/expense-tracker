import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// GET: fetch group by ?id=xxx
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing group id" }, { status: 400 });
    const rows = await sql`SELECT id, name, members, created_at FROM groups WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: create new group
export async function POST(req: NextRequest) {
  try {
    const { id, name, pin, members } = await req.json();
    if (!id || !name || !pin || !members?.length) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    if (members.length < 2 || members.length > 4) return NextResponse.json({ error: "2-4 members required" }, { status: 400 });
    await sql`INSERT INTO groups (id, name, pin, members) VALUES (${id}, ${name}, ${pin}, ${members})`;
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT: verify PIN
export async function PUT(req: NextRequest) {
  try {
    const { id, pin, action, newPin, newMembers } = await req.json();
    if (!id || !pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const rows = await sql`SELECT pin, members FROM groups WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    if (rows[0].pin !== pin) return NextResponse.json({ error: "Wrong PIN" }, { status: 403 });

    // Change PIN
    if (action === "changePin" && newPin) {
      await sql`UPDATE groups SET pin = ${newPin}, updated_at = NOW() WHERE id = ${id}`;
      return NextResponse.json({ ok: true, action: "pinChanged" });
    }

    // Update members
    if (action === "updateMembers" && newMembers) {
      await sql`UPDATE groups SET members = ${newMembers}, updated_at = NOW() WHERE id = ${id}`;
      return NextResponse.json({ ok: true, action: "membersUpdated" });
    }

    // Just verify PIN
    return NextResponse.json({ ok: true, verified: true, members: rows[0].members });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
