import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { heroSlides } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { heroInputSchema } from "@/lib/admin/validators";

function heroId() {
  return `hero_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const db = getDb();
  return json({
    slides: db.select().from(heroSlides).orderBy(asc(heroSlides.sortOrder)).all(),
  });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = heroInputSchema.parse(await request.json());
    const db = getDb();
    const now = new Date().toISOString();
    const row = {
      id: heroId(),
      title: body.title,
      subtitle: body.subtitle,
      ctaLabel: body.ctaLabel,
      ctaHref: body.ctaHref,
      imageUrl: body.imageUrl,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(heroSlides).values(row).run();
    return json({ slide: row }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create hero slide", 500);
  }
}
