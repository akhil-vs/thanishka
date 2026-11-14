import type { Product } from "@/lib/products";

export type SizeChartRow = [string, string, string, string];

const standardChart: SizeChartRow[] = [
  ["XS", "32", "24", "34"],
  ["S", "34", "26", "36"],
  ["M", "36", "28", "38"],
  ["L", "38", "30", "40"],
  ["XL", "40", "32", "42"],
  ["XXL", "42", "34", "44"],
];

const kurtaChart: SizeChartRow[] = [
  ["XS", "34", "28", "—"],
  ["S", "36", "30", "—"],
  ["M", "38", "32", "—"],
  ["L", "40", "34", "—"],
  ["XL", "42", "36", "—"],
  ["XXL", "44", "38", "—"],
];

const setSareeChart: SizeChartRow[] = [
  ["XS", "32", "—", "—"],
  ["S", "34", "—", "—"],
  ["M", "36", "—", "—"],
  ["L", "38", "—", "—"],
  ["XL", "40", "—", "—"],
  ["XXL", "42", "—", "—"],
];

const gownChart: SizeChartRow[] = [
  ["XS", "32", "25", "35"],
  ["S", "34", "27", "37"],
  ["M", "36", "29", "39"],
  ["L", "38", "31", "41"],
  ["XL", "40", "33", "43"],
  ["XXL", "42", "35", "45"],
];

export function sizeChartForProduct(product: Product): {
  columns: [string, string, string, string];
  rows: SizeChartRow[];
  note: string;
} {
  switch (product.categorySlug) {
    case "kurtis-sets":
      return {
        columns: ["Size", "Bust", "Kurta length", "Hip"],
        rows: kurtaChart,
        note: "Lengths in inches. Between sizes? Prefer the larger bust for comfort.",
      };
    case "set-saree":
      return {
        columns: ["Size", "Blouse bust", "Saree", "Petticoat"],
        rows: setSareeChart,
        note: "Blouse is pre-stitched to bust. Saree and petticoat are free-size within the set.",
      };
    case "gowns-anarkalis":
      return {
        columns: ["Size", "Bust", "Waist", "Hip"],
        rows: gownChart,
        note: "Measured in inches over undergarments. Flowing hems — prioritize bust fit.",
      };
    case "co-ords":
      return {
        columns: ["Size", "Bust", "Waist", "Hip"],
        rows: standardChart,
        note: "Top and bottom are cut as a set. If between sizes, size up for the pant hip.",
      };
    default:
      return {
        columns: ["Size", "Bust", "Waist", "Hip"],
        rows: standardChart,
        note: "Measurements in inches. Chat on WhatsApp with bust/waist/hip if you are unsure.",
      };
  }
}
