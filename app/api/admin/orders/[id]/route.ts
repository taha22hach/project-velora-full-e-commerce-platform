import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
const schema = z.object({ status: z.enum(["new", "confirmed", "processing", "shipped", "delivered", "cancelled"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  const rate = rateLimit("admin-order:" + user.id, 60, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة." }, { status: 429 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "حالة الطلب غير صحيحة." }, { status: 400 });
  const { data, error } = await supabase.rpc("admin_update_order_status", { p_order_id: id, p_status: parsed.data.status });
  if (error) return NextResponse.json({ error: "تعذر تحديث الطلب." }, { status: 400 });
  return NextResponse.json({ success: Boolean(data) });
}
