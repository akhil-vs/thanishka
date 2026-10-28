import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { offers } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { offerInputSchema } from "@/lib/admin/validators";

function offerId() {
  return `ofr_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const db = getDb();
  return json({
    offers: db.select().from(offers).orderBy(asc(offers.sortOrder)).all(),
  });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = offerInputSchema.parse(await request.json());
    const db = getDb();
    const now = new Date().toISOString();
    const row = {
      id: offerId(),
      title: body.title,
      eyebrow: body.eyebrow ?? "",
      subtitle: body.subtitle,
      ctaLabel: body.ctaLabel,
      ctaHref: body.ctaHref,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(offers).values(row).run();
    return json({ offer: row }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create offer", 500);
  }
}
