import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`SELECT id, username, amount, description, created_at FROM expenses ORDER BY created_at DESC`;
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
    await sql`INSERT INTO expenses (id, username, amount, description) VALUES (${id}, ${username}, ${amount}, ${description})`;
    return NextResponse.json({ ok: true });
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
