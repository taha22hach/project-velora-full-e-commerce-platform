import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
const schema = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), description: z.string().max(1000).optional(), imageUrl: z.union([z.url().refine((value) => new URL(value).protocol === "https:"),z.literal("")]).optional(), sortOrder: z.number().int().min(0).max(10000).default(0) });
export async function POST(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "راجعي بيانات التصنيف." }, { status: 400 });
  const value = parsed.data;
  const { error } = await supabase.from("categories").insert({ name: value.name, slug: value.slug, description: value.description || null, image_url: value.imageUrl || null, sort_order: value.sortOrder });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "رابط التصنيف مستخدم بالفعل." : "تعذر حفظ التصنيف." }, { status: 400 });
  return NextResponse.json({ success: true }, { status: 201 });
}
