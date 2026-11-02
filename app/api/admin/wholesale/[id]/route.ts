import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
const schema = z.object({ decision: z.enum(["approved", "rejected"]), discountPercent: z.number().min(0).max(80), minimumQuantity: z.number().int().min(1).max(100_000) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  const rate = rateLimit("admin-wholesale:" + user.id, 30, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة." }, { status: 429 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "راجعي قرار الاعتماد." }, { status: 400 });
  const { error } = await supabase.rpc("review_wholesale_application", {
    p_application_id: id,
    p_decision: parsed.data.decision,
    p_discount_percent: parsed.data.discountPercent,
    p_minimum_quantity: parsed.data.minimumQuantity,
  });
  if (error) return NextResponse.json({ error: "تعذر تحديث طلب الجملة." }, { status: 400 });
  return NextResponse.json({ success: true });
}
