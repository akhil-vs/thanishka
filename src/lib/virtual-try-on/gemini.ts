/**
 * Virtual try-on image generation via the Google Gemini API (direct).
 */

import { GoogleGenAI } from "@google/genai";
import { VTO_API_CONFIG } from "@/lib/virtual-try-on/constants";

type InlineImage = {
  mimeType: string;
  data: string;
};

function parseDataUrl(dataUrl: string): InlineImage {
  const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid data URL image");
  }
  return { mimeType: match[1], data: match[2] };
}

async function toInlineImage(source: string): Promise<InlineImage> {
  if (source.startsWith("data:")) {
    return parseDataUrl(source);
  }

  if (!source.startsWith("http://") && !source.startsWith("https://")) {
    throw new Error("Image must be a data URL or http(s) URL");
  }

  const res = await fetch(source);
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const mimeType = contentType.split(";")[0]?.trim() || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new Error(`URL did not return an image (${mimeType})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { mimeType, data: buffer.toString("base64") };
}

export async function generateVirtualTryOnImage(params: {
  prompt: string;
  userImage: string;
  productImage: string;
  apiKey: string;
  model?: string;
}): Promise<{ imageUrl: string | null; description: string }> {
  const {
    prompt,
    userImage,
    productImage,
    apiKey,
    model = VTO_API_CONFIG.MODEL,
  } = params;

  const [person, garment] = await Promise.all([
    toInlineImage(userImage),
    toInlineImage(productImage),
  ]);

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { text: "Photo 1 (person):" },
          { inlineData: person },
          { text: "Photo 2 (garment):" },
          { inlineData: garment },
        ],
      },
    ],
    config: {
      temperature: VTO_API_CONFIG.TEMPERATURE,
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: VTO_API_CONFIG.ASPECT_RATIO,
      },
    },
  });

  let imageUrl: string | null = null;
  let description = "";

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.text) {
      description = description ? `${description}\n${part.text}` : part.text;
    }
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      imageUrl = `data:${mime};base64,${part.inlineData.data}`;
    }
  }

  return { imageUrl, description };
}
