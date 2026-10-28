import { and, asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { offers } from "@/db/schema";
import { json } from "@/lib/admin/http";

export async function GET() {
  await connection();
  const db = getDb();
  const rows = db
    .select()
    .from(offers)
    .where(and(eq(offers.active, true)))
    .orderBy(asc(offers.sortOrder))
    .all();

  return json({ offers: rows });
}
