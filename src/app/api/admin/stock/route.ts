import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { applyStockChange, totalUnits } from "@/lib/admin/stock";
import { stockSingleSchema } from "@/lib/admin/validators";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const db = getDb();
  const rows = db.select().from(products).all();
  const movements = db
    .select()
    .from(stockMovements)
    .orderBy(desc(stockMovements.createdAt))
    .limit(40)
    .all();

  return json({
    stock: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      active: p.active,
      sizes: p.sizes,
      total: totalUnits(p.sizes),
    })),
    movements,
  });
}

export async function PATCH(request: Request) {
  const { admin, response } = await requireAdmin();
  if (response) return response;

  try {
    const body = stockSingleSchema.parse(await request.json());
    const db = getDb();
    const result = applyStockChange(db, {
      ...body,
      adminId: admin.id,
      source: "single",
    });
    return json({ result });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error(err instanceof Error ? err.message : "Stock update failed", 400);
  }
}
