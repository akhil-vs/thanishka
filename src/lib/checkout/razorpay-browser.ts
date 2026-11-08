export type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: {
  keyId: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
}) {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) {
    throw new Error("Unable to load Razorpay Checkout");
  }

  const rzp = new window.Razorpay({
    key: opts.keyId,
    amount: opts.amountPaise,
    currency: opts.currency,
    name: "Thanishka",
    description: `Order ${opts.orderNumber}`,
    order_id: opts.razorpayOrderId,
    prefill: {
      name: opts.customerName,
      email: opts.customerEmail || undefined,
      contact: opts.customerPhone,
    },
    notes: { orderNumber: opts.orderNumber },
    theme: { color: "#1a1a1a" },
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss },
  });

  rzp.open();
}
