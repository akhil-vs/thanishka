import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { productInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return error("Product not found", 404);
  return json({ product });
}

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = productInputSchema.partial().parse(await request.json());
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return error("Product not found", 404);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        compareAt:
          body.compareAt === undefined ? existing.compareAt : body.compareAt,
      },
    });
    return json({ product });
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
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return error("Product not found", 404);

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });

  return json({ ok: true });
}
