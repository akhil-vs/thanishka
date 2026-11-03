import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { normalizePhone } from "./phone";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 8;

function hashOtp(phone: string, code: string) {
  const pepper = process.env.OTP_PEPPER ?? process.env.CUSTOMER_JWT_SECRET ?? "dev-otp-pepper";
  return createHash("sha256").update(`${phone}:${code}:${pepper}`).digest("hex");
}

function generateCode() {
  const fixed = process.env.OTP_DEV_CODE?.trim();
  if (fixed && /^\d{4,6}$/.test(fixed)) return fixed;
  return String(randomInt(100000, 999999));
}

export function isOtpDevMode() {
  return (
    process.env.OTP_DEV_MODE === "true" ||
    process.env.NODE_ENV !== "production" ||
    Boolean(process.env.OTP_DEV_CODE)
  );
}

export async function requestOtp(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false as const, error: "Enter a valid mobile number" };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.otpChallenge.count({
    where: { phone, createdAt: { gte: since } },
  });
  if (recent >= MAX_REQUESTS_PER_HOUR) {
    return { ok: false as const, error: "Too many OTP requests. Try again later." };
  }

  const code = generateCode();
  const challenge = await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash: hashOtp(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  // Hook for SMS providers later. Dev/console mode surfaces the code.
  if (isOtpDevMode()) {
    console.info(`[otp] ${phone} → ${code}`);
  }

  return {
    ok: true as const,
    challengeId: challenge.id,
    phone,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    ...(isOtpDevMode() ? { devCode: code } : {}),
  };
}

export async function verifyOtp(challengeId: string, code: string) {
  const challenge = await prisma.otpChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge || challenge.consumedAt) {
    return { ok: false as const, error: "OTP expired or invalid. Request a new code." };
  }
  if (challenge.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "OTP expired. Request a new code." };
  }
  if (challenge.attemptCount >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "Too many attempts. Request a new code." };
  }

  const match = challenge.codeHash === hashOtp(challenge.phone, code.trim());
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: {
      attemptCount: { increment: 1 },
      ...(match ? { consumedAt: new Date() } : {}),
    },
  });

  if (!match) {
    return { ok: false as const, error: "Incorrect OTP" };
  }

  return { ok: true as const, phone: challenge.phone };
}
