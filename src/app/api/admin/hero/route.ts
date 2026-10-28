import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { heroInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const slides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return json({ slides });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = heroInputSchema.parse(await request.json());
    const slide = await prisma.heroSlide.create({
      data: {
        title: body.title,
        subtitle: body.subtitle,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        imageUrl: body.imageUrl,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return json({ slide }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create hero slide", 500);
  }
}
