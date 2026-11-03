import { error, fromZod, json } from "@/lib/http";
import { verifyOtp } from "@/lib/auth/otp";
import { createCustomerSession } from "@/lib/auth/customer";
import { ensureCustomerUser, publicUser } from "@/lib/auth/users";
import { otpVerifySchema } from "@/lib/auth/validators";

export async function POST(request: Request) {
  try {
    const body = otpVerifySchema.parse(await request.json());
    const verified = await verifyOtp(body.challengeId, body.code);
    if (!verified.ok) return error(verified.error, 401);

    const user = await ensureCustomerUser({
      phone: verified.phone,
      name: body.name,
    });
    await createCustomerSession(user);
    return json({ user: publicUser(user) });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to verify OTP", 500);
  }
}
