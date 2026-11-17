import { VTO_EXCLUDED_CATEGORY_SLUGS } from "@/lib/virtual-try-on/constants";

export function isVirtualTryOnEligible(categorySlug: string): boolean {
  return !(VTO_EXCLUDED_CATEGORY_SLUGS as readonly string[]).includes(
    categorySlug,
  );
}

/** Prefer GEMINI_API_KEY; accept common Google aliases used in older setups. */
export function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  return key || undefined;
}

export function isVirtualTryOnConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}
