import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/catalog";
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, products] = await Promise.all([searchParams, getProducts()]);
  const needle = q.toLocaleLowerCase("ar");
  const filtered = products.filter((product) => [product.name, product.brand, product.category].some((item) => item.toLocaleLowerCase("ar").includes(needle)));
  return <ProductGrid products={filtered} title={q ? "نتائج البحث عن «" + q + "»" : "ابحثي عن منتجك"} description={q ? "المنتجات التي وجدناها لكِ" : "استخدمي خانة البحث للوصول إلى ما تحبين"} />;
}
