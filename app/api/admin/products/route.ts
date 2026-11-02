import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  sku: z.string().trim().min(2).max(80),
  description: z.string().max(5000).default(""),
  categoryId: z.uuid(),
  brandId: z.uuid().nullable(),
  price: z.number().positive().max(1_000_000),
  salePrice: z.number().positive().max(1_000_000).nullable(),
  wholesalePrice: z.number().positive().max(1_000_000).nullable(),
  stock: z.number().int().min(0).max(1_000_000),
  minimumWholesaleQuantity: z.number().int().min(1).max(100_000),
  variants: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    sku: z.string().trim().min(2).max(80),
    options: z.record(z.string(), z.string().max(80)).default({}),
    priceModifier: z.number().min(-1_000_000).max(1_000_000).default(0),
    stock: z.number().int().min(0).max(1_000_000),
  })).max(100).default([]),
  imageUrl: z.union([z.url().refine((value) => new URL(value).protocol === "https:"), z.literal("")]).default(""),
  images: z.array(z.object({ url: z.url(), storagePath: z.string().regex(/^products\/[a-zA-Z0-9-]+\.(?:jpg|png|webp)$/) })).max(8).default([]),
}).refine((value) => value.salePrice === null || value.salePrice < value.price, { message: "سعر العرض يجب أن يقل عن سعر التجزئة.", path: ["salePrice"] })
  .refine((value) => value.variants.length === 0 || value.stock === 0, { message: "المخزون يُحدد لكل خيار عند استخدام المتغيرات.", path: ["stock"] })
  .refine((value) => value.variants.every((variant) => Math.min(value.price, value.salePrice ?? value.price, value.wholesalePrice ?? value.price) + variant.priceModifier > 0), { message: "سعر الخيار لا يمكن أن يكون صفراً أو سالباً." });

export async function POST(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  const rate = rateLimit("admin-product:" + user.id, 30, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة. حاولي لاحقاً." }, { status: 429 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "راجعي بيانات المنتج." }, { status: 400 });
  const value = parsed.data;
  const { data: product, error } = await supabase.from("products").insert({
    name: value.name,
    slug: value.slug,
    sku: value.sku,
    description: value.description,
    category_id: value.categoryId,
    brand_id: value.brandId,
    retail_price: value.price,
    sale_price: value.salePrice,
    wholesale_price: value.wholesalePrice,
    minimum_wholesale_quantity: value.minimumWholesaleQuantity,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "الرابط أو رمز SKU مستخدم بالفعل." : "تعذر حفظ المنتج." }, { status: 400 });
  const { error: stockError } = await supabase.from("inventory").update({ quantity_available: value.stock }).eq("product_id", product.id);
  if (stockError) {
    await supabase.from("products").delete().eq("id", product.id);
    return NextResponse.json({ error: "تعذر تسجيل المخزون الأولي." }, { status: 400 });
  }
  if (value.stock > 0) {
    const { error: movementError } = await supabase.from("inventory_movements").insert({ product_id: product.id, change_quantity: value.stock, reason: "initial_stock", reference_id: null, created_by: user.id });
    if (movementError) {
      await supabase.from("inventory_movements").delete().eq("product_id", product.id);
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: "تعذر تسجيل حركة المخزون." }, { status: 400 });
    }
  }
  if (value.variants.length) {
    const { data: createdVariants, error: variantError } = await supabase.from("product_variants").insert(value.variants.map((variant) => ({
      product_id: product.id, name: variant.name, sku: variant.sku, options: variant.options, price_modifier: variant.priceModifier,
    }))).select("id,sku");
    if (variantError || !createdVariants) {
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: variantError?.code === "23505" ? "رمز SKU لأحد الخيارات مستخدم بالفعل." : "تعذر حفظ خيارات المنتج." }, { status: 400 });
    }
    const inventoryRows = createdVariants.map((variant, index) => ({ product_id: product.id, variant_id: variant.id, quantity_available: value.variants[index].stock }));
    const { error: variantStockError } = await supabase.from("inventory").upsert(inventoryRows, { onConflict: "product_id,variant_id" });
    if (variantStockError) {
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: "تعذر تسجيل مخزون الخيارات." }, { status: 400 });
    }
    const movements = inventoryRows.filter((row) => row.quantity_available > 0).map((row) => ({ product_id: product.id, variant_id: row.variant_id, change_quantity: row.quantity_available, reason: "initial_stock" as const, created_by: user.id }));
    if (movements.length) {
      const { error: variantMovementError } = await supabase.from("inventory_movements").insert(movements);
      if (variantMovementError) {
        await supabase.from("inventory_movements").delete().eq("product_id", product.id);
        await supabase.from("products").delete().eq("id", product.id);
        return NextResponse.json({ error: "تعذر تسجيل حركة مخزون الخيارات." }, { status: 400 });
      }
    }
  }
  const images: { product_id: string; url: string; storage_path: string | null; alt_text: string; position: number }[] = value.images.map((image) => ({ product_id: product.id, url: image.url, storage_path: image.storagePath, alt_text: value.name, position: 0 }));
  if (value.imageUrl && !images.length) images.push({ product_id: product.id, url: value.imageUrl, storage_path: null, alt_text: value.name, position: 0 });
  if (images.length) {
    images.forEach((image, index) => { image.position = index; });
    const { error: imageError } = await supabase.from("product_images").insert(images);
    if (imageError) {
      await supabase.from("inventory_movements").delete().eq("product_id", product.id);
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: "تعذر ربط صور المنتج." }, { status: 400 });
    }
  }
  return NextResponse.json({ id: product.id }, { status: 201 });
}
