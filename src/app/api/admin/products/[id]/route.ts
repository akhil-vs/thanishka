import { error, fromZod, json, requireBackoffice } from "@/lib/admin/http";
import { productInputSchema } from "@/lib/admin/validators";
import { revalidateCatalog } from "@/lib/catalog-revalidate";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

function saleFlag(
  price: number,
  compareAt: number | null | undefined,
  explicit?: boolean,
) {
  if (explicit !== undefined) return explicit;
  return Boolean(compareAt != null && compareAt > price);
}

export async function GET(_request: Request, { params }: Params) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return error("Product not found", 404);
  return json({ product });
}

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireBackoffice();
  if (response) return response;

  try {
    const { id } = await params;
    const raw = await request.json();
    const body = productInputSchema.partial().parse(raw);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return error("Product not found", 404);

    const pricingTouched =
      body.price !== undefined ||
      body.compareAt !== undefined ||
      body.onSale !== undefined;

    const nextPrice = body.price ?? existing.price;
    const nextCompareAt =
      body.compareAt === undefined ? existing.compareAt : body.compareAt;

    if (
      pricingTouched &&
      (body.price !== undefined || body.compareAt !== undefined) &&
      nextCompareAt != null &&
      nextCompareAt > 0 &&
      nextCompareAt <= nextPrice
    ) {
      return error(
        "MRP / original price must be higher than the selling price",
        400,
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        compareAt: nextCompareAt,
        ...(pricingTouched
          ? {
              onSale: saleFlag(nextPrice, nextCompareAt, body.onSale),
            }
          : {}),
      },
    });
    revalidateCatalog();
    return json({ product });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update product", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return error("Product not found", 404);

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });
  revalidateCatalog();

  return json({ ok: true });
}
