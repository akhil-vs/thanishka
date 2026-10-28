import { getDb } from "@/db";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { applyStockChange } from "@/lib/admin/stock";
import { stockBulkSchema } from "@/lib/admin/validators";

export async function POST(request: Request) {
  const { admin, response } = await requireAdmin();
  if (response) return response;

  try {
    const body = stockBulkSchema.parse(await request.json());
    const db = getDb();
    const results = [];

    for (const item of body.items) {
      results.push(
        applyStockChange(db, {
          ...item,
          note: body.note,
          adminId: admin.id,
          source: "bulk",
        }),
      );
    }

    return json({ count: results.length, results });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error(err instanceof Error ? err.message : "Bulk stock failed", 400);
  }
}
