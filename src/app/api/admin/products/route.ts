import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { productInputSchema } from "@/lib/admin/validators";

function productId() {
  return `prd_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const db = getDb();
  const rows = db.select().from(products).orderBy(desc(products.updatedAt)).all();
  return json({ products: rows });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = productInputSchema.parse(await request.json());
    const db = getDb();
    const now = new Date().toISOString();
    const row = {
      id: productId(),
      ...body,
      compareAt: body.compareAt ?? null,
      isNew: body.isNew ?? true,
      onSale: body.onSale ?? Boolean(body.compareAt),
      featured: body.featured ?? false,
      active: body.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(products).values(row).run();
    return json({ product: row }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create product", 500);
  }
}
