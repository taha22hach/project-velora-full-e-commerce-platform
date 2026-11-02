import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-grid";
import { categories as demoCategories } from "@/lib/data";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const category = [...categories, ...demoCategories].find((item) => item.slug === slug);
  if (!category) notFound();
  return <><div className="category-hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(49,34,40,.48),rgba(49,34,40,.08)),url('" + category.image + "')" }}><div className="page-wrap"><span className="eyebrow">اكتشفي VELORA</span><h1>{category.name}</h1><p>{category.description || "اختياراتنا الخاصة، لتفاصيل يومك الجميلة."}</p></div></div><ProductGrid products={products.filter((product) => product.categorySlug === slug)} title={category.name} /></>;
}
