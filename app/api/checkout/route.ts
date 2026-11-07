import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,24}$/, "رقم الهاتف غير صحيح"),
  governorate: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(100),
  street: z.string().trim().min(3).max(300),
  notes: z.string().trim().max(300).default(""),
});

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.uuid(),
    variantId: z.uuid().nullable().optional(),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(50),
  address: addressSchema,
  coupon: z.string().trim().max(40).optional(),
});

const orderResultSchema = z.object({ id: z.uuid(), order_number: z.string().min(1) });

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(new Uint8Array(signature));
}

function makeConfirmationToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

function getTrustedClientAddress(request: Request) {
  const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareAddress) return cloudflareAddress;
  return process.env.NODE_ENV === "production" ? null : "127.0.0.1";
}

function mapOrderError(message: string) {
  const code = message.split(":", 1)[0].trim();
  const messages: Record<string, string> = {
    OUT_OF_STOCK: "تغير المخزون قبل تأكيد طلبك. راجعي الكميات وحاولي مرة أخرى.",
    INVALID_PRODUCT: "أحد المنتجات لم يعد متاحاً.",
    INVALID_COUPON: "كود الخصم غير صالح أو انتهت صلاحيته.",
    MINIMUM_ORDER: "لم تستوفي الكمية الحد الأدنى لطلب الجملة.",
    RATE_LIMIT: "وصلتِ للحد المسموح من الطلبات. حاولي لاحقاً.",
    INVALID_ADDRESS: "راجعي بيانات عنوان التوصيل.",
    INVALID_ITEMS: "راجعي المنتجات والكميات في سلتك.",
  };
  return { code, error: messages[code] || "تعذر حفظ الطلب. حاولي مرة أخرى." };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "صيغة الطلب غير صحيحة." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "راجعي بيانات الطلب والعنوان." }, { status: 400 });
  }

  const uniqueItems = new Map<string, { product_id: string; variant_id: string | null; quantity: number }>();
  for (const item of parsed.data.items) {
    const variantId = item.variantId || null;
    const key = `${item.productId}:${variantId || "base"}`;
    const existing = uniqueItems.get(key);
    const quantity = (existing?.quantity || 0) + item.quantity;
    if (quantity > 50) {
      return NextResponse.json({ error: "الحد الأقصى للكمية هو ٥٠ من كل منتج." }, { status: 400 });
    }
    uniqueItems.set(key, { product_id: item.productId, variant_id: variantId, quantity });
  }

  const actor = await getApiActor();
  if (!actor.supabase) {
    return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  }
  if (actor.user && (!actor.profile || !actor.profile.is_active)) {
    return NextResponse.json({ error: "الحساب غير نشط أو تعذر التحقق منه." }, { status: 401 });
  }

  const address = {
    recipient_name: parsed.data.address.recipientName,
    phone: parsed.data.address.phone,
    governorate: parsed.data.address.governorate,
    city: parsed.data.address.city,
    area: parsed.data.address.area,
    street: parsed.data.address.street,
    notes: parsed.data.address.notes,
  };
  const items = Array.from(uniqueItems.values());
  let orderData: unknown;

  if (actor.user) {
    const rate = rateLimit(`checkout:${actor.user.id}`, 5, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "محاولات كثيرة. انتظري قليلاً قبل إعادة المحاولة." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
      );
    }

    const { data, error } = await actor.supabase.rpc("place_order_secure", {
      p_items: items,
      p_address: address,
      p_coupon_code: parsed.data.coupon || null,
      p_payment_method: "cash_on_delivery",
    });
    if (error) {
      const mapped = mapOrderError(error.message);
      return NextResponse.json({ error: mapped.error }, { status: mapped.code === "RATE_LIMIT" ? 429 : 400 });
    }
    orderData = data;
  } else {
    const service = createServiceClient();
    if (!service) {
      return NextResponse.json(
        { error: "إتمام طلب الضيف يحتاج إعداد مفتاح الخادم في بيئة النشر." },
        { status: 503 }
      );
    }

    const clientAddress = getTrustedClientAddress(request);
    if (!clientAddress) {
      return NextResponse.json({ error: "تعذر التحقق من مصدر الطلب." }, { status: 503 });
    }
    const rateLimitSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rateLimitSecret) {
      return NextResponse.json({ error: "إعداد حماية طلبات الضيوف غير مكتمل." }, { status: 503 });
    }
    const guestIdentityHash = await hmacHex(
      rateLimitSecret,
      `velora-guest-rate-limit:v1:${clientAddress}`
    );
    const { data: allowed, error: rateError } = await service.rpc("consume_guest_checkout_rate_limit", {
      p_identity_hash: guestIdentityHash,
    });
    if (rateError) {
      return NextResponse.json({ error: "تعذر التحقق من حد الطلبات. حاولي لاحقاً." }, { status: 503 });
    }
    if (allowed !== true) {
      return NextResponse.json(
        { error: "وصلتِ للحد المسموح من الطلبات. حاولي لاحقاً." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const confirmationToken = makeConfirmationToken();
    const confirmationTokenHash = await sha256Hex(confirmationToken);
    const { data, error } = await service.rpc("place_guest_order_secure", {
      p_items: items,
      p_address: address,
      p_coupon_code: parsed.data.coupon || null,
      p_payment_method: "cash_on_delivery",
      p_guest_identity_hash: guestIdentityHash,
      p_guest_confirmation_token_hash: confirmationTokenHash,
    });
    if (error) {
      const mapped = mapOrderError(error.message);
      return NextResponse.json({ error: mapped.error }, { status: mapped.code === "RATE_LIMIT" ? 429 : 400 });
    }
    const order = orderResultSchema.safeParse(data);
    if (!order.success) {
      return NextResponse.json({ error: "تعذر تأكيد حفظ الطلب." }, { status: 500 });
    }
    return NextResponse.json({
      orderId: order.data.id,
      orderNumber: order.data.order_number,
      confirmationToken,
      guest: true,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  const order = orderResultSchema.safeParse(orderData);
  if (!order.success) {
    return NextResponse.json({ error: "تعذر تأكيد حفظ الطلب." }, { status: 500 });
  }
  return NextResponse.json({
    orderId: order.data.id,
    orderNumber: order.data.order_number,
    guest: false,
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
