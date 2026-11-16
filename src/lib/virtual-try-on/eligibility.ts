import { VTO_EXCLUDED_CATEGORY_SLUGS } from "@/lib/virtual-try-on/constants";

export function isVirtualTryOnEligible(categorySlug: string): boolean {
  return !(VTO_EXCLUDED_CATEGORY_SLUGS as readonly string[]).includes(
    categorySlug,
  );
}

export function isVirtualTryOnConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}
