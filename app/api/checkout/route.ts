import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  items: z.array(z.object({ productId: z.uuid(), variantId: z.uuid().nullable().optional(), quantity: z.number().int().min(1).max(50) })).min(1).max(50),
  address: z.object({
    recipientName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(24),
    city: z.string().trim().min(2).max(80),
    area: z.string().trim().min(2).max(100),
    street: z.string().trim().min(3).max(300),
    notes: z.string().trim().max(300).default(""),
  }),
  coupon: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  const actor = await getApiActor();
  if (!actor.supabase) return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  if (!actor.user || !actor.profile?.is_active) return NextResponse.json({ error: "سجّلي الدخول لإتمام الطلب." }, { status: 401 });
  const rate = rateLimit("checkout:" + actor.user.id, 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "محاولات كثيرة. انتظري قليلاً قبل إعادة المحاولة." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });

  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "صيغة الطلب غير صحيحة." }, { status: 400 }); }
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "راجعي بيانات الطلب والعنوان." }, { status: 400 });
  const uniqueItems = new Map<string, { product_id: string; variant_id: string | null; quantity: number }>();
  for (const item of parsed.data.items) {
    const key = item.productId + ":" + (item.variantId || "base");
    const existing = uniqueItems.get(key);
    uniqueItems.set(key, { product_id: item.productId, variant_id: item.variantId || null, quantity: (existing?.quantity || 0) + item.quantity });
  }

  const { data, error } = await actor.supabase.rpc("place_order_secure", {
    p_items: Array.from(uniqueItems.values()),
    p_address: {
      recipient_name: parsed.data.address.recipientName,
      phone: parsed.data.address.phone,
      city: parsed.data.address.city,
      area: parsed.data.address.area,
      street: parsed.data.address.street,
      notes: parsed.data.address.notes,
    },
    p_coupon_code: parsed.data.coupon || null,
    p_payment_method: "cash_on_delivery",
  });
  if (error) {
    const knownMessages: Record<string, string> = {
      OUT_OF_STOCK: "تغير المخزون قبل تأكيد طلبك. راجعي الكميات وحاولي مرة أخرى.",
      INVALID_PRODUCT: "أحد المنتجات لم يعد متاحاً.",
      INVALID_COUPON: "كود الخصم غير صالح أو انتهت صلاحيته.",
      MINIMUM_ORDER: "لم تستوفي الكمية الحد الأدنى لطلب الجملة.",
      RATE_LIMIT: "وصلتِ للحد المسموح من الطلبات. حاولي لاحقاً.",
    };
    const code = error.message.split(":")[0];
    return NextResponse.json({ error: knownMessages[code] || "تعذر حفظ الطلب. حاولي مرة أخرى." }, { status: code === "RATE_LIMIT" ? 429 : 400 });
  }
  return NextResponse.json({ orderId: data.id, orderNumber: data.order_number }, { status: 201 });
}
