"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import { cn } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "#cart", label: "Bag", icon: ShoppingBag },
  { href: "/wishlist", label: "Saved", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const openCart = useUI((s) => s.openCart);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            item.href !== "#cart" &&
            (item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.href === "#cart") {
            return (
              <li key={item.label}>
                <button
                  onClick={openCart}
                  className="relative flex w-full flex-col items-center gap-1 py-2.5 text-muted"
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="font-display text-[9px] tracking-[0.14em]">
                    {item.label}
                  </span>
                  {count > 0 && (
                    <span className="absolute top-1 right-[28%] flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 font-display text-[8px] text-ivory">
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5",
                  active ? "text-charcoal" : "text-muted",
                )}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="font-display text-[9px] tracking-[0.14em]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
