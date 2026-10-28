import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { discountInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const discounts = await prisma.discount.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return json({ discounts });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = discountInputSchema.parse(await request.json());
    const discount = await prisma.discount.create({
      data: {
        code: body.code.trim().toUpperCase(),
        label: body.label,
        type: body.type,
        value: body.value,
        minOrder: body.minOrder ?? 0,
        maxUses: body.maxUses ?? null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        active: body.active ?? true,
      },
    });
    return json({ discount }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create discount", 500);
  }
}
