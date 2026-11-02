import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
const schema = z.object({ name: z.string().trim().min(2).max(100).optional(), description: z.string().max(1000).nullable().optional(), imageUrl: z.union([z.url().refine((value) => new URL(value).protocol === "https:"),z.literal("")]).nullable().optional(), sortOrder: z.number().int().min(0).max(10000).optional(), isActive: z.boolean().optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success || !Object.keys(parsed.data || {}).length) return NextResponse.json({ error: "راجعي بيانات التصنيف." }, { status: 400 });
  const v = parsed.data;
  const { error } = await supabase.from("categories").update({
    ...(v.name !== undefined ? { name: v.name } : {}),
    ...(v.description !== undefined ? { description: v.description } : {}),
    ...(v.imageUrl !== undefined ? { image_url: v.imageUrl } : {}),
    ...(v.sortOrder !== undefined ? { sort_order: v.sortOrder } : {}),
    ...(v.isActive !== undefined ? { is_active: v.isActive } : {}),
  }).eq("id", id);
  if (error) return NextResponse.json({ error: "تعذر تحديث التصنيف." }, { status: 400 });
  return NextResponse.json({ success: true });
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "التصنيف يحتوي منتجات أو تعذر حذفه. أوقفي عرضه بدلاً من ذلك." }, { status: 400 });
  return NextResponse.json({ success: true });
}
