import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { discounts } from "@/db/schema";
import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { discountInputSchema } from "@/lib/admin/validators";

function discountId() {
  return `dsc_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const db = getDb();
  return json({
    discounts: db.select().from(discounts).orderBy(desc(discounts.updatedAt)).all(),
  });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = discountInputSchema.parse(await request.json());
    const db = getDb();
    const now = new Date().toISOString();
    const row = {
      id: discountId(),
      code: body.code.trim().toUpperCase(),
      label: body.label,
      type: body.type,
      value: body.value,
      minOrder: body.minOrder ?? 0,
      maxUses: body.maxUses ?? null,
      usedCount: 0,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      active: body.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(discounts).values(row).run();
    return json({ discount: row }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create discount", 500);
  }
}
