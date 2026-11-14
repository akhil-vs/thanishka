import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/ProductDetail";
import {
  getCatalogProduct,
  getCatalogRelated,
  listCatalogProducts,
} from "@/lib/catalog";

export async function generateStaticParams() {
  const products = await listCatalogProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.description,
  };
}

async function ProductPageInner({ slug }: { slug: string }) {
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  const related = await getCatalogRelated(product);
  return <ProductDetail product={product} related={related} />;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="container-page py-20 font-serif text-muted">
          Loading piece…
        </div>
      }
    >
      <ProductPageInner slug={slug} />
    </Suspense>
  );
}
