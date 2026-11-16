/**
 * Prompt adapted from creativoma/virtual-try-on-store (MIT)
 * https://github.com/creativoma/virtual-try-on-store
 */

interface PromptParams {
  productName: string;
  productDescription: string;
  fabric?: string;
  category?: string;
}

export function generateVirtualTryOnPrompt(params: PromptParams): string {
  const { productName, productDescription, fabric, category } = params;

  return `You are an expert AI fashion photographer specializing in photorealistic virtual try-on images for a premium women's boutique (Indian readymade wear — kurtis, co-ords, gowns, anarkalis, party and western dresses).

TASK: Create a photorealistic image showing the person from Photo 1 wearing the exact garment from Photo 2.

CRITICAL REQUIREMENTS:

PERSON (from Photo 1):
- Preserve EXACT facial features, expressions, and proportions
- Maintain EXACT skin tone, texture, and natural lighting on skin
- Keep EXACT hairstyle, color, and hair texture
- Preserve body type, height proportions, and posture
- Keep natural body language and stance

GARMENT (from Photo 2):
- Replicate EXACT fabric texture, weave pattern, and material appearance
- Copy EXACT colors using the same RGB values and saturation
- Maintain ALL design details: borders, embroidery, prints, necklines, sleeves visible on FRONT
- Preserve EXACT fit style (oversized/fitted/relaxed/flared) and how fabric drapes
- Include ALL distressing, fading, wrinkles, or wear patterns
- Maintain seam placement, pocket positions, button or zip details
- Keep exact sleeve length, hem length, and garment proportions
- If the garment has a kasavu or gold border, keep the border placement and tone accurate

POSE & ORIENTATION (CRITICAL):
- Detect the person's facing direction in Photo 1 (frontal/side/back view)
- Orient the garment to match the detected body pose and viewing angle
- If person faces camera: show garment front with design details visible
- If person is in side view: show appropriate side of garment with realistic draping
- If person shows back: show garment back
- Maintain realistic fabric draping that matches the body's orientation

GARMENT ORIENTATION (CRITICAL):
- Clothing tags/labels MUST be hidden at the BACK of the neck, NOT visible (when frontal)
- Front of garment faces camera when person faces camera
- Verify garment is worn correctly: front-to-front, back-to-back
- Neckline should be clean with NO visible internal tags or labels (when frontal)

ACCESSORY HANDLING:
- Preserve ALL accessories from Photo 1 unless they conflict with the garment
- Keep footwear from Photo 1 exactly as shown
- Preserve jewelry from Photo 1
- If trying on an upper / full dress / kurti / gown: replace the conflicting top or dress layer with Photo 2; keep shoes and non-conflicting accessories
- Do NOT invent a saree drape, pallu, or petticoat that is not in Photo 2

REALISM & PHYSICS:
- Fabric must drape naturally according to gravity and body shape
- Wrinkles at natural stress points (elbows, shoulders, waist)
- Shadows and highlights must match the lighting direction
- No floating fabric or impossible fabric behavior

COMPOSITION:
- Portrait-friendly framing suitable for fashion e-commerce (roughly 3:4)
- Prefer full or three-quarter body so hem length is visible for dresses and anarkalis
- Soft, clean studio or neutral background — no busy scenes
- Professional focus on garment with sharp detail

QUALITY STANDARDS:
- Photorealistic rendering, indistinguishable from real photography
- No AI artifacts, blurring, or unrealistic textures
- Clean edges where garment meets skin
- Accurate colour for boutique e-commerce

FORBIDDEN:
- Do NOT alter the person's face or body beyond wearing the garment
- Do NOT change garment colours or design from Photo 2
- Do NOT turn the look into a draped saree / mundu unless Photo 2 clearly is that garment
- Do NOT generate multiple people or partial / cropped-off heads
- Do NOT show clothing tags at the neckline front
- Do NOT put the garment on backwards or inside-out

CONTEXT:
Product Name: ${productName}
Category: ${category || "apparel"}
Fabric: ${fabric || "as shown"}
Product Description: ${productDescription}

Generate a single photorealistic boutique-ready image that combines the person from Photo 1 wearing the exact garment from Photo 2.`;
}
