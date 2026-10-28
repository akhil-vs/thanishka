import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { productInputSchema } from "@/lib/admin/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const db = getDb();
  const product = db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return error("Product not found", 404);
  return json({ product });
}

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = productInputSchema.partial().parse(await request.json());
    const db = getDb();
    const existing = db.select().from(products).where(eq(products.id, id)).get();
    if (!existing) return error("Product not found", 404);

    const updated = {
      ...existing,
      ...body,
      compareAt:
        body.compareAt === undefined ? existing.compareAt : body.compareAt,
      updatedAt: new Date().toISOString(),
    };

    db.update(products).set(updated).where(eq(products.id, id)).run();
    return json({ product: updated });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update product", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const db = getDb();
  const existing = db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) return error("Product not found", 404);

  db.update(products)
    .set({ active: false, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id))
    .run();

  return json({ ok: true });
}
