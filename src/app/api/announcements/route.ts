import { connection } from "next/server";
import { json } from "@/lib/admin/http";
import { prisma } from "@/lib/db";

export async function GET() {
  await connection();
  const announcements = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return json({
    messages: announcements.map((a) => a.message),
  });
}
