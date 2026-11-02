import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
const schema = z.object({ status: z.enum(["approved","rejected","pending"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "الحالة غير صحيحة." }, { status: 400 });
  const { error } = await supabase.from("reviews").update({ status: parsed.data.status }).eq("id", id);
  if (error) return NextResponse.json({ error: "تعذر تحديث التقييم." }, { status: 400 });
  return NextResponse.json({ success: true });
}
