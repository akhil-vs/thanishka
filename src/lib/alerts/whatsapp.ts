import type { OrderAlertMessage } from "@/lib/alerts/order-message";

export type WhatsAppSender = {
  token: string;
  phoneNumberId: string;
  templateName: string | null;
  templateLang: string;
  graphVersion: string;
};

const PLACEHOLDER_DIGITS = new Set(["919876543210", "9876543210"]);

export function digitsForWhatsApp(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (
    PLACEHOLDER_DIGITS.has(digits) ||
    digits.endsWith("9876543210")
  ) {
    return null;
  }

  let normalized = digits;
  if (normalized.length === 11 && normalized.startsWith("0")) {
    normalized = `91${normalized.slice(1)}`;
  } else if (normalized.length === 10) {
    normalized = `91${normalized}`;
  }

  if (normalized.length < 11 || normalized.length > 15) return null;
  return normalized;
}

/**
 * Phone that should receive the shop alert.
 * SHOP_ALERT_WHATSAPP wins, then the shop record, then the public store number.
 */
export function resolveAlertRecipient(shopWhatsapp?: string | null) {
  return (
    digitsForWhatsApp(process.env.SHOP_ALERT_WHATSAPP) ||
    digitsForWhatsApp(shopWhatsapp) ||
    digitsForWhatsApp(process.env.STORE_WHATSAPP) ||
    digitsForWhatsApp(process.env.NEXT_PUBLIC_STORE_WHATSAPP)
  );
}

function graphVersion() {
  const raw = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0";
  return /^v\d+(\.\d+)?$/.test(raw) ? raw : "v21.0";
}

function templateName() {
  const raw = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "";
  if (!raw) return null;
  if (!/^[a-z0-9_]+$/.test(raw)) {
    console.warn(
      "[alerts] WHATSAPP_TEMPLATE_NAME must use lowercase letters, numbers, and underscores; sending a text message instead",
    );
    return null;
  }
  return raw;
}

function templateLang() {
  const raw = process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en";
  return /^[a-z]{2}(_[A-Z]{2})?$/.test(raw) ? raw : "en";
}

export function readWhatsAppSender(): WhatsAppSender | null {
  const token = process.env.WHATSAPP_TOKEN?.trim() || "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || "";
  if (!token || /[\r\n]/.test(token)) return null;
  if (!/^\d{5,30}$/.test(phoneNumberId)) return null;
  return {
    token,
    phoneNumberId,
    templateName: templateName(),
    templateLang: templateLang(),
    graphVersion: graphVersion(),
  };
}

export function buildWhatsAppRequest(
  sender: WhatsAppSender,
  to: string,
  message: OrderAlertMessage,
) {
  const url = `https://graph.facebook.com/${sender.graphVersion}/${sender.phoneNumberId}/messages`;
  if (sender.templateName) {
    return {
      url,
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: sender.templateName,
          language: { code: sender.templateLang },
          components: [
            {
              type: "body",
              parameters: message.templateParams.map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      },
    };
  }

  return {
    url,
    body: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: message.whatsappText },
    },
  };
}

export async function sendOrderWhatsApp(opts: {
  sender: WhatsAppSender;
  to: string;
  message: OrderAlertMessage;
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { url, body } = buildWhatsAppRequest(opts.sender, opts.to, opts.message);
  const fetchImpl = opts.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.sender.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      let detail = `WhatsApp request failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: { message?: unknown } };
        if (typeof data?.error?.message === "string" && data.error.message.trim()) {
          detail = data.error.message.trim().slice(0, 300);
        }
      } catch {
        /* keep the status fallback */
      }
      return { ok: false, error: detail };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "WhatsApp request failed";
    return { ok: false, error: message.slice(0, 300) };
  }
}
