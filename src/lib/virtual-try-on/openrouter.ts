/**
 * OpenRouter image generation adapted from creativoma/virtual-try-on-store (MIT)
 * https://github.com/creativoma/virtual-try-on-store
 */

import { OpenRouter } from "@openrouter/sdk";
import { VTO_API_CONFIG } from "@/lib/virtual-try-on/constants";

type ResponseInputText = {
  type: "input_text";
  text: string;
};

type ResponseInputImage = {
  type: "input_image";
  detail: "auto" | "high" | "low";
  imageUrl?: string | null;
};

type ContentItem = ResponseInputText | ResponseInputImage;

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

  const openRouter = new OpenRouter({
    apiKey,
    httpReferer: VTO_API_CONFIG.OPENROUTER.HTTP_REFERER,
    xTitle: VTO_API_CONFIG.OPENROUTER.X_TITLE,
  });

  const contentItems: ContentItem[] = [
    { type: "input_text", text: prompt },
  ];

  if (userImage) {
    contentItems.push({
      type: "input_image",
      detail: "high",
      imageUrl: userImage,
    });
  }

  if (productImage) {
    contentItems.push({
      type: "input_image",
      detail: "high",
      imageUrl: productImage,
    });
  }

  const response = await openRouter.beta.responses.send({
    model,
    input: [
      {
        type: "message",
        role: "user",
        content: contentItems,
      },
    ],
    stream: false,
    temperature: VTO_API_CONFIG.TEMPERATURE,
  });

  let imageUrl: string | null = null;
  let description = "";

  if (response.output && Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item.type === "image_generation_call") {
        const imageItem = item as { result?: string };
        if (imageItem.result) {
          imageUrl = imageItem.result.startsWith("data:")
            ? imageItem.result
            : `data:image/png;base64,${imageItem.result}`;
        }
      }

      if (item.type === "message" && "content" in item && item.content) {
        const messageContent = item.content;
        if (Array.isArray(messageContent)) {
          const textPart = messageContent.find(
            (part: { type?: string; text?: string }) =>
              part?.type === "text" && part?.text,
          );
          if (textPart && "text" in textPart && textPart.text) {
            description = textPart.text;
          }
        }
      }
    }
  }

  return { imageUrl, description };
}
