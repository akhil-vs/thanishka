import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Syne } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Thanishka | Boutique Dresses in Trivandrum",
    template: "%s · Thanishka",
  },
  description:
    "Modern premium boutique for readymade women's dresses in Trivandrum, Kerala. Party wear, kurtis, co-ords, anarkalis and kasavu-inspired festive edits — sized XS–XXL.",
  keywords: [
    "boutique in Trivandrum",
    "women dresses Kerala",
    "Onam dress",
    "readymade kurtis Trivandrum",
    "Thanishka boutique",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
