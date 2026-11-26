"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  RAZORPAY_PAYMENT_BUTTON_SRC,
  razorpayPaymentButtonId,
} from "@/lib/checkout/payment-button";

type Status = "loading" | "ready" | "error";

/** Razorpay renders an anchor with this class, not a native button. */
function paymentControl(form: HTMLElement) {
  return form.querySelector(".PaymentButton");
}

/**
 * Razorpay's payment-button.js reads `document.currentScript.dataset` and
 * requires that script to be a direct child of a `<form>`. `next/script`
 * relocates third-party scripts, so the widget is mounted here instead.
 */
export function RazorpayPaymentButton({ className }: { className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    if (paymentControl(form)) {
      setStatus("ready");
      return;
    }

    let cancelled = false;
    form.replaceChildren();

    const script = document.createElement("script");
    script.async = true;
    script.src = RAZORPAY_PAYMENT_BUTTON_SRC;
    script.setAttribute(
      "data-payment_button_id",
      razorpayPaymentButtonId(),
    );

    const markReady = () => {
      if (cancelled) return;
      if (paymentControl(form)) setStatus("ready");
    };

    const observer = new MutationObserver(markReady);
    observer.observe(form, { childList: true, subtree: true });

    script.onerror = () => {
      if (!cancelled) setStatus("error");
    };

    form.appendChild(script);

    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      if (!paymentControl(form)) setStatus("error");
    }, 12000);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timeout);
      // Drop a script that has not run yet so a detached copy cannot alert.
      if (!paymentControl(form)) form.replaceChildren();
    };
  }, []);

  return (
    <div className={className}>
      <p className="font-display text-[10px] tracking-[0.16em] text-muted">
        Pay with Razorpay
      </p>
      <form
        ref={formRef}
        id={`razorpay-payment-button-${reactId}`}
        aria-busy={status === "loading"}
        aria-label="Pay with Razorpay"
        className="razorpay-embed mt-3"
      />
      {status === "loading" ? (
        <p className="mt-2 text-xs text-muted">Loading secure payment…</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-2 text-sm text-sale" role="alert">
          The Razorpay payment button could not be loaded. Refresh the page
          to try again.
        </p>
      ) : null}
      {status === "ready" ? (
        <p className="mt-2 text-xs text-muted">
          Charges the amount saved on this Razorpay payment button.
        </p>
      ) : null}
    </div>
  );
}
