import { and, asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { heroSlides } from "@/db/schema";
import { json } from "@/lib/admin/http";

export async function GET() {
  await connection();
  const db = getDb();
  const slides = db
    .select()
    .from(heroSlides)
    .where(and(eq(heroSlides.active, true)))
    .orderBy(asc(heroSlides.sortOrder))
    .all()
    .map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      cta: s.ctaLabel,
      href: s.ctaHref,
      image: s.imageUrl,
    }));

  return json({ slides });
}
