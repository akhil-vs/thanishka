import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { heroSlides } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { heroInputSchema } from "@/lib/admin/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = heroInputSchema.partial().parse(await request.json());
    const db = getDb();
    const existing = db
      .select()
      .from(heroSlides)
      .where(eq(heroSlides.id, id))
      .get();
    if (!existing) return error("Hero slide not found", 404);

    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    db.update(heroSlides).set(updated).where(eq(heroSlides.id, id)).run();
    return json({ slide: updated });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update hero slide", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const db = getDb();
  const existing = db
    .select()
    .from(heroSlides)
    .where(eq(heroSlides.id, id))
    .get();
  if (!existing) return error("Hero slide not found", 404);
  db.delete(heroSlides).where(eq(heroSlides.id, id)).run();
  return json({ ok: true });
}
