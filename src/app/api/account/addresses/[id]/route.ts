import { error, fromZod, json } from "@/lib/http";
import { requireCustomer } from "@/lib/auth/policy";
import { addressInputSchema } from "@/lib/auth/validators";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user, response } = await requireCustomer();
  if (response || !user) return response;
  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return error("Address not found", 404);

  try {
    const body = addressInputSchema.partial().parse(await request.json());
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.line1 !== undefined ? { line1: body.line1 } : {}),
        ...(body.line2 !== undefined ? { line2: body.line2 } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.postalCode !== undefined ? { postalCode: body.postalCode } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
      },
    });
    return json({ address });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update address", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, response } = await requireCustomer();
  if (response || !user) return response;
  const { id } = await params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return error("Address not found", 404);

  await prisma.address.delete({ where: { id } });
  return json({ ok: true });
}
