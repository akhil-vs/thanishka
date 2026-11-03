import { z } from "zod";

export const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const otpRequestSchema = z.object({
  phone: z.string().min(8).max(20),
});

export const otpVerifySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(4).max(8),
  name: z.string().min(2).max(80).optional(),
});

export const customerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(20).optional(),
});

export const addressInputSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  line1: z.string().min(3).max(120),
  line2: z.string().max(120).optional().nullable(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80).optional(),
  postalCode: z.string().min(4).max(12),
  phone: z.string().min(8).max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
});
