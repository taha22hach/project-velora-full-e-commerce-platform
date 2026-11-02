import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
const schema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9_-]+$/),
  discountType: z.enum(["percentage","fixed"]),
  discountValue: z.number().positive().max(100000),
  minimumOrder: z.number().min(0).max(10000000).default(0),
  startsAt: z.iso.datetime().nullable().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perCustomerLimit: z.number().int().positive().max(1000).default(1),
}).refine((value) => value.discountType !== "percentage" || value.discountValue <= 100, { message: "نسبة الخصم لا تتجاوز ١٠٠٪.", path: ["discountValue"] });
export async function POST(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "راجعي بيانات الكوبون." }, { status: 400 });
  const v = parsed.data;
  const { error } = await supabase.from("coupons").insert({ code: v.code, discount_type: v.discountType, discount_value: v.discountValue, minimum_order: v.minimumOrder, starts_at: v.startsAt || null, expires_at: v.expiresAt || null, usage_limit: v.usageLimit ?? null, per_customer_limit: v.perCustomerLimit });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "كود الخصم مستخدم بالفعل." : "تعذر إنشاء الكوبون." }, { status: 400 });
  return NextResponse.json({ success: true }, { status: 201 });
}
