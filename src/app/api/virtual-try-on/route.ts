import { z } from "zod";
import { error, fromZod, json } from "@/lib/http";
import { VTO_API_CONFIG, VTO_ERROR_MESSAGES } from "@/lib/virtual-try-on/constants";
import {
  getGeminiApiKey,
  isVirtualTryOnConfigured,
  isVirtualTryOnEligible,
} from "@/lib/virtual-try-on/eligibility";
import { generateVirtualTryOnImage } from "@/lib/virtual-try-on/gemini";
import { generateVirtualTryOnPrompt } from "@/lib/virtual-try-on/prompts";

/** Image generation can exceed the default serverless budget. */
export const maxDuration = 60;

const bodySchema = z.object({
  userImage: z.string().min(1),
  productImage: z.string().min(1),
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000).optional().default(""),
  categorySlug: z.string().min(1),
  fabric: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
});

function absoluteProductImage(productImage: string, request: Request): string {
  if (
    productImage.startsWith("data:") ||
    productImage.startsWith("http://") ||
    productImage.startsWith("https://")
  ) {
    return productImage;
  }
  const url = new URL(request.url);
  const origin =
    request.headers.get("x-forwarded-host") != null
      ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
      : url.origin;
  return productImage.startsWith("/")
    ? `${origin}${productImage}`
    : `${origin}/${productImage}`;
}

export async function GET() {
  return json({
    enabled: isVirtualTryOnConfigured(),
    model: VTO_API_CONFIG.MODEL,
  });
}

export async function POST(request: Request) {
  if (!isVirtualTryOnConfigured()) {
    return error(VTO_ERROR_MESSAGES.NOT_CONFIGURED, 503);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return error(VTO_ERROR_MESSAGES.INVALID_REQUEST);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return fromZod(parsed.error);

  const {
    userImage,
    productImage,
    productName,
    productDescription,
    categorySlug,
    fabric,
    category,
  } = parsed.data;

  if (!isVirtualTryOnEligible(categorySlug)) {
    return error(VTO_ERROR_MESSAGES.CATEGORY_BLOCKED, 403);
  }

  const apiKey = getGeminiApiKey()!;
  const prompt = generateVirtualTryOnPrompt({
    productName,
    productDescription,
    fabric,
    category,
  });

  try {
    const result = await generateVirtualTryOnImage({
      prompt,
      userImage,
      productImage: absoluteProductImage(productImage, request),
      apiKey,
      model: VTO_API_CONFIG.MODEL,
    });

    if (!result.imageUrl) {
      return error(VTO_ERROR_MESSAGES.GENERATION_ERROR, 502);
    }

    return json({
      imageUrl: result.imageUrl,
      description:
        result.description ||
        `Preview of ${productName} — illustration only; use the size guide for fit.`,
      usedModel: VTO_API_CONFIG.MODEL,
    });
  } catch (err) {
    console.error("[virtual-try-on]", err);
    const message = err instanceof Error ? err.message : VTO_ERROR_MESSAGES.AI_FAILED;
    return json(
      { error: VTO_ERROR_MESSAGES.UPSTREAM, detail: message },
      { status: 502 },
    );
  }
}
