import { z } from "zod";

export const feedbackSubmitSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters")
    .max(500, "Keep feedback under 500 characters"),
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .optional(),
  accessToken: z.string().min(1).optional(),
});

export const feedbackStatusSchema = z.object({
  status: z.enum(["NEW", "REVIEWED", "PUBLISHED", "HIDDEN"]),
});
