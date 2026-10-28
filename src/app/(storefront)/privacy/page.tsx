import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-2xl py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">Privacy</h1>
      <div className="mt-8 space-y-4 font-serif text-lg leading-relaxed text-muted">
        <p>
          We collect account, order and delivery details only to fulfil
          purchases, send transactional messages, and — with consent — marketing
          emails or WhatsApp offers.
        </p>
        <p>
          Payments are processed by PCI-compliant gateways (Razorpay / Cashfree).
          We do not store full card numbers on our servers.
        </p>
        <p>
          Contact hello@thanishka.store to access, correct or delete your data.
        </p>
      </div>
    </div>
  );
}
