import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const wishlistSchema = z.object({ productIds: z.array(z.uuid()).max(250) });

export async function GET() {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase || !user || !profile?.is_active) return NextResponse.json({ productIds: [] });
  const { data, error } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "تعذر تحميل قائمة الأمنيات." }, { status: 400 });
  return NextResponse.json({ productIds: (data || []).map((row) => row.product_id) });
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || !profile?.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  if (!rateLimit("wishlist:" + user.id, 30, 60_000).allowed) return NextResponse.json({ error: "محاولات كثيرة." }, { status: 429 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = wishlistSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "قائمة الأمنيات غير صالحة." }, { status: 400 });

  const productIds = [...new Set(parsed.data.productIds)];
  const { error: deleteError } = await supabase.from("wishlists").delete().eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "تعذر تحديث قائمة الأمنيات." }, { status: 400 });
  if (productIds.length) {
    const { error } = await supabase.from("wishlists").insert(productIds.map((productId) => ({ user_id: user.id, product_id: productId })));
    if (error) return NextResponse.json({ error: "تعذر تحديث قائمة الأمنيات." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
