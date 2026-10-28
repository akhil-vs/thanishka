import { connection } from "next/server";
import { json } from "@/lib/admin/http";
import { prisma } from "@/lib/db";

export async function GET() {
  await connection();
  const offers = await prisma.offer.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return json({ offers });
}
