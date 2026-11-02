import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  variants: z.array(z.object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1).max(100),
    sku: z.string().trim().min(2).max(80),
    options: z.record(z.string(), z.string().max(80)).default({}),
    priceModifier: z.number().min(-1_000_000).max(1_000_000),
    stock: z.number().int().min(0).max(1_000_000),
  })).max(100),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "معرف المنتج غير صالح." }, { status: 400 });
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  if (!rateLimit("admin-variants:" + user.id, 30, 60_000).allowed) return NextResponse.json({ error: "محاولات كثيرة." }, { status: 429 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "راجعي بيانات خيارات المنتج." }, { status: 400 });
  const ids = parsed.data.variants.flatMap((variant) => variant.id ? [variant.id] : []);
  const skus = parsed.data.variants.map((variant) => variant.sku.toLowerCase());
  if (new Set(ids).size !== ids.length || new Set(skus).size !== skus.length) return NextResponse.json({ error: "معرف أو رمز SKU مكرر داخل الخيارات." }, { status: 400 });

  const { data, error } = await supabase.rpc("admin_sync_product_variants", {
    p_product_id: id,
    p_variants: parsed.data.variants.map((variant) => ({
      ...(variant.id ? { id: variant.id } : {}),
      name: variant.name,
      sku: variant.sku,
      options: variant.options,
      price_modifier: variant.priceModifier,
      stock: variant.stock,
    })),
  });
  if (error) {
    const code = error.message.split(":")[0];
    const messages: Record<string, string> = {
      INVALID_PRODUCT: "المنتج غير موجود.",
      INVALID_VARIANT: "أحد الخيارات لا يتبع هذا المنتج.",
      INVALID_VARIANTS: "بيانات الخيارات أو أسعارها غير صالحة.",
    };
    return NextResponse.json({ error: messages[code] || "تعذر حفظ خيارات المنتج. تحققي من رموز SKU." }, { status: 400 });
  }
  return NextResponse.json({ success: true, count: data });
}
