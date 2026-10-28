import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import { getProduct, getRelated, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return <ProductDetail product={product} related={getRelated(product)} />;
}
