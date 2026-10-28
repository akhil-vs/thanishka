import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { offers } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { offerInputSchema } from "@/lib/admin/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = offerInputSchema.partial().parse(await request.json());
    const db = getDb();
    const existing = db.select().from(offers).where(eq(offers.id, id)).get();
    if (!existing) return error("Offer not found", 404);

    const updated = {
      ...existing,
      ...body,
      startsAt: body.startsAt === undefined ? existing.startsAt : body.startsAt,
      endsAt: body.endsAt === undefined ? existing.endsAt : body.endsAt,
      updatedAt: new Date().toISOString(),
    };

    db.update(offers).set(updated).where(eq(offers.id, id)).run();
    return json({ offer: updated });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update offer", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const db = getDb();
  const existing = db.select().from(offers).where(eq(offers.id, id)).get();
  if (!existing) return error("Offer not found", 404);
  db.delete(offers).where(eq(offers.id, id)).run();
  return json({ ok: true });
}
