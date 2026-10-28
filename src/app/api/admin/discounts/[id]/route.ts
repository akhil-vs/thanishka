import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { discounts } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { discountInputSchema } from "@/lib/admin/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = discountInputSchema.partial().parse(await request.json());
    const db = getDb();
    const existing = db.select().from(discounts).where(eq(discounts.id, id)).get();
    if (!existing) return error("Discount not found", 404);

    const updated = {
      ...existing,
      ...body,
      code: body.code ? body.code.trim().toUpperCase() : existing.code,
      maxUses: body.maxUses === undefined ? existing.maxUses : body.maxUses,
      startsAt: body.startsAt === undefined ? existing.startsAt : body.startsAt,
      endsAt: body.endsAt === undefined ? existing.endsAt : body.endsAt,
      updatedAt: new Date().toISOString(),
    };

    db.update(discounts).set(updated).where(eq(discounts.id, id)).run();
    return json({ discount: updated });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update discount", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const db = getDb();
  const existing = db.select().from(discounts).where(eq(discounts.id, id)).get();
  if (!existing) return error("Discount not found", 404);
  db.delete(discounts).where(eq(discounts.id, id)).run();
  return json({ ok: true });
}
