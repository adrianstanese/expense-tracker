import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(req: NextRequest) {
  try {
    const gid = req.nextUrl.searchParams.get("gid");
    const month = req.nextUrl.searchParams.get("month"); // "2026-04" or empty for all
    if (!gid) return NextResponse.json({ error: "Missing group id" }, { status: 400 });

    const grp = await sql`SELECT name, members FROM groups WHERE id=${gid}`;
    if (grp.length === 0) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    let rows;
    if (month) {
      rows = await sql`SELECT username, amount_eur, category, trip, scope, created_at FROM expenses WHERE group_id=${gid} AND created_at::text LIKE ${month + '%'} ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT username, amount_eur, category, trip, scope, created_at FROM expenses WHERE group_id=${gid} ORDER BY created_at DESC`;
    }

    const members: string[] = grp[0].members;
    const groupName = grp[0].name;
    const total = rows.reduce((s: number, r: any) => s + Number(r.amount_eur || 0), 0);

    // Per member
    const perMember: Record<string, number> = {};
    members.forEach(m => { perMember[m] = rows.filter((r: any) => r.username === m).reduce((s: number, r: any) => s + Number(r.amount_eur || 0), 0); });

    // Per category
    const perCat: Record<string, number> = {};
    rows.forEach((r: any) => { const c = r.category || "Other"; perCat[c] = (perCat[c] || 0) + Number(r.amount_eur || 0); });
    const catSorted = Object.entries(perCat).sort((a, b) => b[1] - a[1]);

    // Per trip
    const perTrip: Record<string, number> = {};
    rows.forEach((r: any) => { if (r.trip) perTrip[r.trip] = (perTrip[r.trip] || 0) + Number(r.amount_eur || 0); });

    // Shared vs personal
    const shared = rows.filter((r: any) => (r.scope || "shared") === "shared").reduce((s: number, r: any) => s + Number(r.amount_eur || 0), 0);
    const personal = total - shared;

    const period = month ? `${MONTHS[parseInt(month.slice(5)) - 1]} ${month.slice(0, 4)}` : "All Time";

    return NextResponse.json({
      groupName,
      members,
      period,
      total,
      count: rows.length,
      perMember,
      catSorted,
      perTrip: Object.entries(perTrip).sort((a, b) => b[1] - a[1]),
      shared,
      personal,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
