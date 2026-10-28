import { connection } from "next/server";
import { json } from "@/lib/admin/http";
import { prisma } from "@/lib/db";

export async function GET() {
  await connection();
  const slides = await prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return json({
    slides: slides.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      cta: s.ctaLabel,
      href: s.ctaHref,
      image: s.imageUrl,
    })),
  });
}
