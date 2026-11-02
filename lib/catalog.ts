import { categories as demoCategories, products as demoProducts } from "@/lib/data";
import type { Category, Product } from "@/lib/types";
import type { CatalogRow } from "@/lib/query-types";
import { createClient } from "@/lib/supabase/server";

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  if (!supabase) return demoProducts;
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name,description,sku,retail_price,sale_price,category_id,brand_id,categories(name,slug),brands(name),product_images(url,position),inventory(quantity_available,variant_id),product_variants(id,name,sku,options,price_modifier,is_active,inventory(quantity_available)),reviews(rating)")
    .eq("is_active", true)
    .eq("reviews.status", "approved")
    .order("created_at", { ascending: false });
  if (error || !data) return demoProducts;
  const rows = (data as unknown as CatalogRow[]).map((row) => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands;
    const image = [...(row.product_images || [])].sort((a, b) => a.position - b.position)[0]?.url;
    const ratings = row.reviews || [];
    const inventory = Array.isArray(row.inventory) ? row.inventory.find((item) => item.variant_id === null) : row.inventory;
    const variantRows = (row.product_variants || []).filter((variant) => variant.is_active);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description || "",
      category: category?.name || "",
      categorySlug: category?.slug || "",
      brand: brand?.name || "VELORA",
      sku: row.sku,
      price: Number(row.retail_price),
      salePrice: row.sale_price === null ? null : Number(row.sale_price),
      wholesalePrice: null,
      stock: inventory?.quantity_available ?? 0,
      rating: ratings.length ? ratings.reduce((sum, entry) => sum + Number(entry.rating), 0) / ratings.length : 0,
      reviewCount: ratings.length,
      image: image || demoProducts[0].image,
      isNew: false,
      isBestSeller: false,
      variants: variantRows.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        options: variant.options || {},
        priceModifier: Number(variant.price_modifier || 0),
        stock: Array.isArray(variant.inventory) ? variant.inventory[0]?.quantity_available ?? 0 : variant.inventory?.quantity_available ?? 0,
      })),
    } as Product;
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "merchant") {
      const { data: pricing } = await supabase.rpc("merchant_product_prices");
      const prices = new Map<string, number>((pricing || []).map((entry: { product_id: string; wholesale_price: number }) => [entry.product_id, Number(entry.wholesale_price)]));
      return rows.map((product) => ({ ...product, wholesalePrice: prices.get(product.id) ?? null }));
    }
  }
  return rows;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  if (!supabase) return demoCategories;
  const { data, error } = await supabase.from("categories").select("id,name,slug,image_url,description").eq("is_active", true).order("sort_order");
  if (error || !data?.length) return error ? demoCategories : [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image_url || demoCategories.find((category) => category.slug === row.slug)?.image || demoCategories[0].image,
    description: row.description || undefined,
  }));
}
