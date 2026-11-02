import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/catalog";
export const metadata: Metadata = { title: "تسوقي كل المنتجات" };
export default async function ShopPage() {
  const products = await getProducts();
  return <ProductGrid products={products} />;
}
