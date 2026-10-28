import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { asSizeMap, asStringArray } from "@/lib/admin/types";
import { productInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const rows = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return json({
    products: rows.map((p) => ({
      ...p,
      colors: asStringArray(p.colors),
      occasion: asStringArray(p.occasion),
      images: asStringArray(p.images),
      sizes: asSizeMap(p.sizes),
    })),
  });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = productInputSchema.parse(await request.json());
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category,
        categorySlug: body.categorySlug,
        price: body.price,
        compareAt: body.compareAt ?? null,
        colors: body.colors,
        fabric: body.fabric,
        occasion: body.occasion,
        description: body.description,
        care: body.care,
        images: body.images,
        sizes: body.sizes,
        isNew: body.isNew ?? true,
        onSale: body.onSale ?? Boolean(body.compareAt),
        featured: body.featured ?? false,
        active: body.active ?? true,
      },
    });
    return json({ product }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create product", 500);
  }
}
