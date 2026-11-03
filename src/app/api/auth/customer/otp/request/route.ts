import { error, fromZod, json } from "@/lib/http";
import { requestOtp } from "@/lib/auth/otp";
import { otpRequestSchema } from "@/lib/auth/validators";

export async function POST(request: Request) {
  try {
    const body = otpRequestSchema.parse(await request.json());
    const result = await requestOtp(body.phone);
    if (!result.ok) return error(result.error, 400);
    return json({
      challengeId: result.challengeId,
      phone: result.phone,
      expiresInSec: result.expiresInSec,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to send OTP", 500);
  }
}
