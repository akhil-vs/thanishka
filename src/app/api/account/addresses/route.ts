import { error, fromZod, json } from "@/lib/http";
import { requireCustomer } from "@/lib/auth/policy";
import { addressInputSchema } from "@/lib/auth/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireCustomer();
  if (response || !user) return response;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return json({ addresses });
}

export async function POST(request: Request) {
  const { user, response } = await requireCustomer();
  if (response || !user) return response;

  try {
    const body = addressInputSchema.parse(await request.json());
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: body.label ?? "Home",
        line1: body.line1,
        line2: body.line2 ?? null,
        city: body.city,
        state: body.state ?? "Kerala",
        postalCode: body.postalCode,
        phone: body.phone ?? null,
        isDefault: body.isDefault ?? false,
      },
    });
    return json({ address });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to save address", 500);
  }
}
