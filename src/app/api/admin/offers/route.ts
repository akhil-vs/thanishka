import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { offerInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const offers = await prisma.offer.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return json({ offers });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = offerInputSchema.parse(await request.json());
    const offer = await prisma.offer.create({
      data: {
        title: body.title,
        eyebrow: body.eyebrow ?? "",
        subtitle: body.subtitle,
        ctaLabel: body.ctaLabel,
        ctaHref: body.ctaHref,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
    });
    return json({ offer }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create offer", 500);
  }
}
