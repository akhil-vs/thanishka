export const VTO_API_CONFIG = {
  OPENROUTER: {
    HTTP_REFERER:
      process.env.OPENROUTER_HTTP_REFERER ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://thanishka.store",
    X_TITLE: "Thanishka Virtual Try-On",
  },
  /** Same model family as creativoma/virtual-try-on-store (OpenRouter → Gemini image). */
  MODEL: "google/gemini-3-pro-image-preview",
  TEMPERATURE: 0.3,
} as const;

export const VTO_ERROR_MESSAGES = {
  NOT_CONFIGURED:
    "Virtual try-on is not configured. Set OPENROUTER_API_KEY on the server.",
  INVALID_REQUEST: "Photo and product image are required.",
  CATEGORY_BLOCKED: "Virtual try-on is not available for this product.",
  GENERATION_ERROR: "Could not generate a try-on preview. Please try again.",
  AI_FAILED: "AI generation failed",
  UPSTREAM: "The try-on service rejected the request. Check API credits and try again.",
} as const;

/** Categories excluded from AI try-on (set saree / mundu drape). */
export const VTO_EXCLUDED_CATEGORY_SLUGS = ["set-saree"] as const;
