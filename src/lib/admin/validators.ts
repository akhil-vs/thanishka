import { z } from "zod";

export const sizesSchema = z.object({
  XS: z.number().int().min(0),
  S: z.number().int().min(0),
  M: z.number().int().min(0),
  L: z.number().int().min(0),
  XL: z.number().int().min(0),
  XXL: z.number().int().min(0),
});

export const productInputSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().min(2),
  categorySlug: z.string().min(2),
  price: z.number().int().positive(),
  compareAt: z.number().int().positive().nullable().optional(),
  colors: z.array(z.string().min(1)).min(1),
  fabric: z.string().min(2),
  occasion: z.array(z.string().min(1)).min(1),
  description: z.string().min(8),
  care: z.string().min(2),
  images: z.array(z.string().url()).min(2),
  sizes: sizesSchema,
  isNew: z.boolean().optional(),
  onSale: z.boolean().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const stockSingleSchema = z.object({
  productId: z.string().min(1),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  mode: z.enum(["set", "adjust"]).default("adjust"),
  quantity: z.number().int().optional(),
  delta: z.number().int().optional(),
  note: z.string().max(240).optional(),
});

export const stockBulkSchema = z.object({
  note: z.string().max(240).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
        mode: z.enum(["set", "adjust"]).default("adjust"),
        quantity: z.number().int().optional(),
        delta: z.number().int().optional(),
      }),
    )
    .min(1),
});

export const discountInputSchema = z.object({
  code: z.string().min(3).max(40),
  label: z.string().min(2),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrder: z.number().int().min(0).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const offerInputSchema = z.object({
  title: z.string().min(2),
  eyebrow: z.string().optional(),
  subtitle: z.string().min(2),
  ctaLabel: z.string().min(2),
  ctaHref: z.string().min(1),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export const heroInputSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().min(2),
  ctaLabel: z.string().min(2),
  ctaHref: z.string().min(1),
  imageUrl: z.string().url(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
