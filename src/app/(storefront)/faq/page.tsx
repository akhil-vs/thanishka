import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

const faqs = [
  {
    q: "Do you offer custom stitching?",
    a: "No — Thanishka is readymade only, stocked from XS to XXL for faster delivery and consistent fit.",
  },
  {
    q: "How do I know my size?",
    a: "Use the size chart on each product page. If you are between sizes, chat with us on WhatsApp with your bust/waist/hip.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI, cards, net banking and cash on delivery via our payment partners. GST invoices are issued with every order.",
  },
  {
    q: "How long does shipping take?",
    a: "Trivandrum PIN codes usually 1–2 days; rest of India 3–6 days after packing. Free shipping above ₹1,999.",
  },
  {
    q: "Can I return or exchange?",
    a: "Unused items with tags can be exchanged within 7 days. See our Returns page for details.",
  },
];

export default function FAQPage() {
  return (
    <div className="container-page max-w-2xl py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">FAQ</h1>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="cursor-pointer list-none font-display text-[12px] tracking-[0.12em]">
              {f.q}
            </summary>
            <p className="mt-3 font-serif text-lg text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
