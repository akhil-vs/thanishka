export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAt?: number;
  colors: string[];
  fabric: string;
  occasion: string[];
  description: string;
  care: string;
  images: [string, string, ...string[]];
  sizes: Record<Size, number>;
  isNew?: boolean;
  onSale?: boolean;
  featured?: boolean;
};

export const categories = [
  { name: "New In", slug: "new-in" },
  { name: "Party & Western", slug: "party-western" },
  { name: "Kurtis & Sets", slug: "kurtis-sets" },
  { name: "Co-ords", slug: "co-ords" },
  { name: "Gowns & Anarkalis", slug: "gowns-anarkalis" },
  { name: "Set Saree / Mundu", slug: "set-saree" },
  { name: "Festive", slug: "festive" },
] as const;

const sizesFull = { XS: 4, S: 8, M: 10, L: 7, XL: 5, XXL: 2 } satisfies Record<
  Size,
  number
>;
const sizesTight = { XS: 1, S: 2, M: 2, L: 1, XL: 0, XXL: 0 } satisfies Record<
  Size,
  number
>;

export const products: Product[] = [
  {
    id: "1",
    slug: "kasavu-whisper-anarkali",
    name: "Kasavu Whisper Anarkali",
    category: "Gowns & Anarkalis",
    categorySlug: "gowns-anarkalis",
    price: 4999,
    compareAt: 5999,
    colors: ["Crimson", "Gold"],
    fabric: "Chanderi silk blend",
    occasion: ["Onam", "Festive", "Wedding"],
    description:
      "A fluid crimson anarkali edged with a fine kasavu border — cut for movement, finished for celebration.",
    care: "Dry clean only. Store folded with tissue.",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=80",
    ],
    sizes: sizesFull,
    isNew: true,
    onSale: true,
    featured: true,
  },
  {
    id: "2",
    slug: "midnight-harbour-gown",
    name: "Midnight Harbour Gown",
    category: "Gowns & Anarkalis",
    categorySlug: "gowns-anarkalis",
    price: 7299,
    colors: ["Charcoal", "Black"],
    fabric: "Crepe satin",
    occasion: ["Party", "Evening"],
    description:
      "Column silhouette with a soft cowl neckline. Evening drama without the fuss of custom stitching.",
    care: "Gentle cold wash. Hang dry.",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80",
    ],
    sizes: sizesFull,
    isNew: true,
    featured: true,
  },
  {
    id: "3",
    slug: "palm-court-co-ord",
    name: "Palm Court Co-ord",
    category: "Co-ords",
    categorySlug: "co-ords",
    price: 3899,
    colors: ["Sand", "Olive"],
    fabric: "Linen blend",
    occasion: ["Day", "Travel"],
    description:
      "Relaxed cropped jacket over a matching midi skirt. Built for Trivandrum heat and weekend plans.",
    care: "Machine wash cold. Warm iron.",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80",
    ],
    sizes: sizesFull,
    isNew: true,
    featured: true,
  },
  {
    id: "4",
    slug: "backwater-flare-dress",
    name: "Backwater Flare Dress",
    category: "Party & Western",
    categorySlug: "party-western",
    price: 3499,
    compareAt: 4199,
    colors: ["Emerald", "Black"],
    fabric: "Georgette",
    occasion: ["Party", "Brunch"],
    description:
      "Soft flare from the waist, square neck, and a deep emerald that reads against ivory walls.",
    care: "Dry clean recommended.",
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80",
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1200&q=80",
    ],
    sizes: sizesTight,
    onSale: true,
    featured: true,
  },
  {
    id: "5",
    slug: "temple-road-kurta-set",
    name: "Temple Road Kurta Set",
    category: "Kurtis & Sets",
    categorySlug: "kurtis-sets",
    price: 2999,
    colors: ["Ivory", "Indigo"],
    fabric: "Cotton mul",
    occasion: ["Day", "Office", "Vishu"],
    description:
      "Straight kurta with tapered pants and a light dupatta. Everyday polish with Kerala ease.",
    care: "Hand wash separately. Shade dry.",
    images: [
      "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=1200&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
    ],
    sizes: sizesFull,
    isNew: true,
  },
  {
    id: "6",
    slug: "onam-edit-set-saree",
    name: "Onam Edit Set Saree",
    category: "Set Saree / Mundu",
    categorySlug: "set-saree",
    price: 5499,
    colors: ["Cream", "Gold"],
    fabric: "Handloom cotton silk",
    occasion: ["Onam", "Festive"],
    description:
      "Ready-to-wear set saree with pre-stitched fall and blouse. Kasavu border, zero draping stress.",
    care: "Dry clean. Avoid direct sunlight when drying.",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
      "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=1200&q=80",
    ],
    sizes: sizesFull,
    featured: true,
  },
  {
    id: "7",
    slug: "vishu-bloom-kurti",
    name: "Vishu Bloom Kurti",
    category: "Kurtis & Sets",
    categorySlug: "kurtis-sets",
    price: 2199,
    colors: ["Yellow", "White"],
    fabric: "Cotton",
    occasion: ["Vishu", "Day"],
    description:
      "A-line kurti with delicate floral placement and side slits. Light enough for a full festive day.",
    care: "Machine wash cold.",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=80",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&q=80",
    ],
    sizes: sizesFull,
    isNew: true,
  },
  {
    id: "8",
    slug: "coastal-slip-dress",
    name: "Coastal Slip Dress",
    category: "Party & Western",
    categorySlug: "party-western",
    price: 2799,
    colors: ["Champagne", "Black"],
    fabric: "Satin",
    occasion: ["Party", "Date"],
    description:
      "Bias-cut slip with adjustable straps. Layer under a blazer or wear alone for dinner by the coast.",
    care: "Hand wash cold. Steam lightly.",
    images: [
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1200&q=80",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80",
    ],
    sizes: sizesFull,
  },
  {
    id: "9",
    slug: "eid-moonlight-anarkali",
    name: "Eid Moonlight Anarkali",
    category: "Gowns & Anarkalis",
    categorySlug: "gowns-anarkalis",
    price: 6499,
    colors: ["Sage", "Gold"],
    fabric: "Organza over silk",
    occasion: ["Eid", "Festive", "Wedding"],
    description:
      "Layered organza anarkali with soft gold threadwork at the neckline and hem.",
    care: "Dry clean only.",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80",
    ],
    sizes: sizesFull,
    featured: true,
  },
  {
    id: "10",
    slug: "sunday-market-co-ord",
    name: "Sunday Market Co-ord",
    category: "Co-ords",
    categorySlug: "co-ords",
    price: 3299,
    compareAt: 3799,
    colors: ["Terracotta", "Cream"],
    fabric: "Cotton poplin",
    occasion: ["Day", "Travel"],
    description:
      "Shirt and wide-leg pant set with clean seams and a soft boxy fit.",
    care: "Machine wash cold. Tumble low.",
    images: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80",
    ],
    sizes: sizesTight,
    onSale: true,
  },
  {
    id: "11",
    slug: "christmas-velvet-midi",
    name: "Christmas Velvet Midi",
    category: "Party & Western",
    categorySlug: "party-western",
    price: 4599,
    colors: ["Wine", "Black"],
    fabric: "Stretch velvet",
    occasion: ["Christmas", "Party"],
    description:
      "Long-sleeve midi with a scooped back. Festive without costume energy.",
    care: "Dry clean. Do not iron directly.",
    images: [
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
    ],
    sizes: sizesFull,
    isNew: true,
  },
  {
    id: "12",
    slug: "mundu-line-wrap",
    name: "Mundu Line Wrap Dress",
    category: "Set Saree / Mundu",
    categorySlug: "set-saree",
    price: 4199,
    colors: ["White", "Gold"],
    fabric: "Cotton kasavu",
    occasion: ["Onam", "Temple", "Festive"],
    description:
      "Contemporary wrap dress inspired by the mundu line — gold border, clean waist tie, fully readymade.",
    care: "Hand wash. Steam iron on reverse.",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
    ],
    sizes: sizesFull,
    featured: true,
  },
];

export const collections = [
  {
    slug: "onam-edit",
    title: "Onam Edit",
    subtitle: "Kasavu borders, soft ivory, ready for the feast.",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&q=80",
  },
  {
    slug: "party-night",
    title: "Party Night",
    subtitle: "Gowns and western cuts that photograph well.",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1400&q=80",
  },
  {
    slug: "everyday-sets",
    title: "Everyday Sets",
    subtitle: "Kurtis and co-ords for the week in Trivandrum.",
    image:
      "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=1400&q=80",
  },
];

export const feedImages = [
  "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
  "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
];

export const testimonials = [
  {
    quote:
      "The Onam set saree arrived ready to wear — fabric felt premium and the fit was true.",
    name: "Ananya R.",
    place: "Kowdiar",
  },
  {
    quote:
      "Finally a boutique site that feels as considered as the clothes. Quick size exchange too.",
    name: "Meera S.",
    place: "Technopark",
  },
  {
    quote:
      "Bought the Palm Court co-ord for a wedding brunch. Soft linen, exact colour as photos.",
    name: "Divya K.",
    place: "Vellayambalam",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelated(product: Product, limit = 4) {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug ||
          p.occasion.some((o) => product.occasion.includes(o))),
    )
    .slice(0, limit);
}

export function filterProducts(opts: {
  category?: string;
  size?: string;
  occasion?: string;
  q?: string;
  sort?: string;
}) {
  let list = [...products];

  if (opts.category && opts.category !== "all" && opts.category !== "new-in") {
    if (opts.category === "festive") {
      list = list.filter((p) =>
        p.occasion.some((o) =>
          ["Onam", "Vishu", "Eid", "Christmas", "Festive", "Wedding"].includes(
            o,
          ),
        ),
      );
    } else {
      list = list.filter((p) => p.categorySlug === opts.category);
    }
  }

  if (opts.category === "new-in") {
    list = list.filter((p) => p.isNew);
  }

  if (opts.size) {
    list = list.filter(
      (p) => (p.sizes[opts.size as Size] ?? 0) > 0,
    );
  }

  if (opts.occasion) {
    list = list.filter((p) =>
      p.occasion.some(
        (o) => o.toLowerCase() === opts.occasion!.toLowerCase(),
      ),
    );
  }

  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q),
    );
  }

  switch (opts.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      break;
    default:
      break;
  }

  return list;
}

export function totalStock(product: Product) {
  return Object.values(product.sizes).reduce((a, b) => a + b, 0);
}
