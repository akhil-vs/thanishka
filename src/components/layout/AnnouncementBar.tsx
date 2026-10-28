"use client";

const messages = [
  "Free shipping above ₹1,999 across Kerala",
  "New: Onam Edit — shop kasavu-ready looks",
  "Visit our boutique · Vellayambalam, Trivandrum",
  "Welcome offer · THANISHKA10 for 10% off first order",
];

export function AnnouncementBar() {
  const loop = [...messages, ...messages];

  return (
    <div className="relative z-50 overflow-hidden border-b border-line bg-emerald text-ivory">
      <div className="marquee-track gap-10 py-2.5 pr-10 whitespace-nowrap">
        {loop.map((msg, i) => (
          <span
            key={`${msg}-${i}`}
            className="font-display text-[10px] tracking-[0.22em] text-ivory/95"
          >
            {msg}
            <span className="mx-10 text-kasavu" aria-hidden>
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
