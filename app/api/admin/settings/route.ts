import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
const webUrl = z.url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol));
const schema = z.object({ storeName: z.string().trim().min(2).max(100), phone: z.string().max(30), email: z.email(), city: z.string().max(120).optional(), flatShippingFee: z.number().min(0).max(100000), freeShippingMinimum: z.number().min(0).max(10000000), instagram: z.union([webUrl,z.literal("")]).optional(), facebook: z.union([webUrl,z.literal("")]).optional(), logoUrl: z.union([webUrl,z.literal("")]).optional(), logoStoragePath: z.string().regex(/^branding\/[a-zA-Z0-9-]+\.(?:jpg|png|webp)$/).nullable().optional() });
export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getApiActor();
  if (!supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!user || profile?.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة البيانات غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "راجعي إعدادات المتجر." }, { status: 400 });
  const v = parsed.data;
  const { data: previous } = await supabase.from("store_settings").select("setting_value").eq("setting_key","store").maybeSingle();
  const previousLogoPath = previous?.setting_value?.logo_storage_path;
  const settings = [
    { setting_key: "store", setting_value: { name: v.storeName, logo_url: v.logoUrl || "", logo_storage_path: v.logoStoragePath || null } },
    { setting_key: "contact", setting_value: { phone: v.phone, email: v.email, city: v.city || "" } },
    { setting_key: "shipping", setting_value: { flat_fee: v.flatShippingFee, free_shipping_minimum: v.freeShippingMinimum } },
    { setting_key: "social", setting_value: { instagram: v.instagram || "", facebook: v.facebook || "" } },
  ];
  const { error } = await supabase.from("store_settings").upsert(settings.map((item) => ({ ...item, updated_by: user.id })), { onConflict: "setting_key" });
  if (error) return NextResponse.json({ error: "تعذر حفظ الإعدادات." }, { status: 400 });
  if (previousLogoPath && previousLogoPath !== v.logoStoragePath) await supabase.storage.from("store-assets").remove([previousLogoPath]);
  return NextResponse.json({ success: true });
}
