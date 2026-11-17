export const VTO_API_CONFIG = {
  /** Google AI Studio / Gemini API image model (Nano Banana Pro). */
  MODEL: "gemini-3-pro-image-preview",
  TEMPERATURE: 0.3,
  ASPECT_RATIO: "3:4",
} as const;

export const VTO_ERROR_MESSAGES = {
  NOT_CONFIGURED:
    "Virtual try-on is not configured. Set GEMINI_API_KEY on the server.",
  INVALID_REQUEST: "Photo and product image are required.",
  CATEGORY_BLOCKED: "Virtual try-on is not available for this product.",
  GENERATION_ERROR: "Could not generate a try-on preview. Please try again.",
  AI_FAILED: "AI generation failed",
  UPSTREAM:
    "The try-on service rejected the request. Check API credits and try again.",
} as const;

/** Categories excluded from AI try-on (set saree / mundu drape). */
export const VTO_EXCLUDED_CATEGORY_SLUGS = ["set-saree"] as const;
