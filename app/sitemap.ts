import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://velora.tha950130.workers.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/shop", "/about", "/contact", "/wholesale"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
    })
  );

  const supabase = await createClient();

  if (!supabase) {
    return staticRoutes;
  }

  const [
    { data: products, error: productsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase.from("products").select("slug").eq("is_active", true),
    supabase.from("categories").select("slug").eq("is_active", true),
  ]);

  const productRoutes =
    !productsError && products
      ? products.map((product) => ({
          url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
        }))
      : [];

  const categoryRoutes =
    !categoriesError && categories
      ? categories.map((category) => ({
          url: `${siteUrl}/categories/${encodeURIComponent(category.slug)}`,
        }))
      : [];

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
