import { error, fromZod, json, requireBackoffice } from "@/lib/admin/http";
import { applyStockChange } from "@/lib/admin/stock";
import { stockBulkSchema } from "@/lib/admin/validators";
import { revalidateCatalog } from "@/lib/catalog-revalidate";

export async function POST(request: Request) {
  const { user, response } = await requireBackoffice();
  if (response || !user) return response;

  try {
    const body = stockBulkSchema.parse(await request.json());
    const results = [];

    for (const item of body.items) {
      results.push(
        await applyStockChange({
          ...item,
          note: body.note,
          userId: user.id,
          source: "bulk",
        }),
      );
    }

    revalidateCatalog();
    return json({ count: results.length, results });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error(err instanceof Error ? err.message : "Bulk stock failed", 400);
  }
}
