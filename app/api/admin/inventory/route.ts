import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
const schema = z.object({ productId: z.uuid(), variantId: z.uuid().nullable().optional(), change: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0), reason: z.enum(["restock","adjustment","return","damaged"]), notes: z.string().max(300).optional() });
export async function POST(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  if (!rateLimit("inventory:" + user.id, 60, 60_000).allowed) return NextResponse.json({ error: "محاولات كثيرة." }, { status: 429 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "راجعي تعديل المخزون." }, { status: 400 });
  const { data, error } = await supabase.rpc("admin_adjust_inventory", { p_product_id: parsed.data.productId, p_change: parsed.data.change, p_reason: parsed.data.reason, p_notes: parsed.data.notes || null, p_variant_id: parsed.data.variantId || null });
  if (error) return NextResponse.json({ error: error.message.includes("NEGATIVE_STOCK") ? "لا يمكن أن يصبح المخزون أقل من صفر." : "تعذر تعديل المخزون." }, { status: 400 });
  return NextResponse.json({ quantity: data });
}
