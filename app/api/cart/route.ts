import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { getProducts } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";
const cartSchema = z.object({
  items: z.array(z.object({
    productId: z.uuid(),
    variantId: z.uuid().nullable(),
    quantity: z.number().int().min(1).max(50),
  })).max(50),
});
export async function GET() {
  const { supabase, user } = await getApiActor();
  if (!supabase || !user) return NextResponse.json({ items: [] });
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
  if (!cart) return NextResponse.json({ items: [] });
  const { data } = await supabase.from("cart_items").select("product_id,variant_id,quantity").eq("cart_id", cart.id);
  const products = await getProducts();
  const byId = new Map(products.map((product) => [product.id, product]));
  const items = (data || []).flatMap((row) => {
    const product = byId.get(row.product_id);
    if (!product) return [];
    const variant = product.variants?.find((entry) => entry.id === row.variant_id);
    return [{
      product,
      variantId: variant?.id,
      variantName: variant?.name,
      priceModifier: variant?.priceModifier ?? 0,
      key: product.id + ":" + (variant?.id || "base"),
      quantity: row.quantity,
    }];
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || !profile?.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  if (!rateLimit("cart:" + user.id, 60, 60_000).allowed) return NextResponse.json({ error: "محاولات كثيرة." }, { status: 429 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = cartSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "راجعي كميات السلة." }, { status: 400 });
  const { error } = await supabase.rpc("save_cart_secure", {
    p_items: parsed.data.items.map((item) => ({ product_id: item.productId, variant_id: item.variantId || null, quantity: item.quantity })),
  });
  if (error) return NextResponse.json({ error: "تعذر مزامنة السلة." }, { status: 400 });
  return NextResponse.json({ success: true });
}
