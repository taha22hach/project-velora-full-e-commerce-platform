import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
const schema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180).optional(),
  sku: z.string().trim().min(2).max(80).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.uuid().optional(),
  brandId: z.uuid().nullable().optional(),
  minimumWholesaleQuantity: z.number().int().min(1).max(100_000).optional(),
  retailPrice: z.number().positive().max(1_000_000).optional(),
  salePrice: z.number().positive().max(1_000_000).nullable().optional(),
  wholesalePrice: z.number().positive().max(1_000_000).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "لا توجد تغييرات.");
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "راجعي البيانات." }, { status: 400 });
  const value = parsed.data;
  if (value.salePrice && value.retailPrice && value.salePrice >= value.retailPrice) return NextResponse.json({ error: "سعر العرض يجب أن يقل عن سعر التجزئة." }, { status: 400 });
  const { error } = await supabase.from("products").update({
    ...(value.name !== undefined ? { name: value.name } : {}),
    ...(value.slug !== undefined ? { slug: value.slug } : {}),
    ...(value.sku !== undefined ? { sku: value.sku } : {}),
    ...(value.description !== undefined ? { description: value.description } : {}),
    ...(value.categoryId !== undefined ? { category_id: value.categoryId } : {}),
    ...(value.brandId !== undefined ? { brand_id: value.brandId } : {}),
    ...(value.minimumWholesaleQuantity !== undefined ? { minimum_wholesale_quantity: value.minimumWholesaleQuantity } : {}),
    ...(value.retailPrice !== undefined ? { retail_price: value.retailPrice } : {}),
    ...(value.salePrice !== undefined ? { sale_price: value.salePrice } : {}),
    ...(value.wholesalePrice !== undefined ? { wholesale_price: value.wholesalePrice } : {}),
    ...(value.isActive !== undefined ? { is_active: value.isActive } : {}),
  }).eq("id", id);
  if (error) return NextResponse.json({ error: "تعذر تحديث المنتج." }, { status: 400 });
  return NextResponse.json({ success: true });
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id).not("storage_path", "is", null);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "تعذر حذف المنتج. أوقفي عرضه بدلاً من ذلك إذا كان مرتبطاً بسجل تاريخي." }, { status: 400 });
  const paths = (images || []).map((image) => image.storage_path).filter(Boolean);
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
  return NextResponse.json({ success: true });
}
