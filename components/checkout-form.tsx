"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MapPin, Banknote } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, getDisplayPrice } from "@/lib/data";

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2, "الاسم مطلوب").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,24}$/, "أدخلي رقم هاتف صحيحاً"),
  governorate: z.string().trim().min(2, "اختاري المحافظة").max(80),
  city: z.string().trim().min(2, "المدينة مطلوبة").max(80),
  area: z.string().trim().min(2, "المنطقة مطلوبة").max(100),
  street: z.string().trim().min(3, "العنوان بالتفصيل مطلوب").max(300),
  notes: z.string().trim().max(300).optional(),
  coupon: z.string().trim().max(40).optional(),
});
type CheckoutValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm() {
  const { items, clear } = useCart();
  const subtotal = items.reduce((sum, item) => sum + (getDisplayPrice(item.product) + item.priceModifier) * item.quantity, 0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const form = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: { recipientName: "", phone: "", governorate: "", city: "", area: "", street: "", notes: "", coupon: "" } });
  const { register, handleSubmit, formState: { errors } } = form;

  async function submit(values: CheckoutValues) {
    if (!items.length) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.product.id, variantId: item.variantId || null, quantity: item.quantity })),
          address: { recipientName: values.recipientName, phone: values.phone, governorate: values.governorate, city: values.city, area: values.area, street: values.street, notes: values.notes || "" },
          coupon: values.coupon || undefined,
        }),
      });
      const result = await response.json().catch(() => null) as {
        error?: string;
        guest?: boolean;
        confirmationToken?: string;
        orderId?: string;
        orderNumber?: string;
      } | null;
      if (!response.ok) {
        setMessage(result?.error || "تعذر إتمام الطلب. راجعي المخزون وحاولي مرة أخرى.");
      } else if (result?.guest && result.confirmationToken && result.orderId) {
        clear();
        router.push("/order-confirmation?orderId=" + encodeURIComponent(result.orderId) + "&token=" + encodeURIComponent(result.confirmationToken));
        router.refresh();
      } else if (result?.orderNumber) {
        clear();
        router.push("/account/orders?placed=" + encodeURIComponent(result.orderNumber));
        router.refresh();
      } else {
        setMessage("تعذر تأكيد الطلب. تحققي من طلباتك قبل إعادة المحاولة.");
      }
    } catch {
      setMessage("تعذر الاتصال لإتمام الطلب. تحققي من اتصالك وحاولي مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="checkout-layout" onSubmit={handleSubmit(submit)}>
    <div className="checkout-fields">
      <section className="checkout-card"><div className="checkout-card-title"><span>١</span><div><h2>عنوان التوصيل</h2><p>أدخلي بيانات استلام الطلب</p></div></div>
        <div className="form-grid"><label>اسم المستلم<input {...register("recipientName")} autoComplete="name" />{errors.recipientName && <small>{errors.recipientName.message}</small>}</label><label>رقم الهاتف<input {...register("phone")} autoComplete="tel" dir="ltr" placeholder="01XXXXXXXXX" />{errors.phone && <small>{errors.phone.message}</small>}</label><label>المحافظة<input {...register("governorate")} autoComplete="address-level1" placeholder="القاهرة" />{errors.governorate && <small>{errors.governorate.message}</small>}</label><label>المدينة<input {...register("city")} autoComplete="address-level2" placeholder="مدينة نصر" />{errors.city && <small>{errors.city.message}</small>}</label><label>المنطقة<input {...register("area")} placeholder="الحي أو المنطقة" />{errors.area && <small>{errors.area.message}</small>}</label><label className="full-field">الشارع والعنوان بالتفصيل<input {...register("street")} autoComplete="street-address" placeholder="اسم الشارع ورقم العقار والشقة" />{errors.street && <small>{errors.street.message}</small>}</label><label className="full-field">ملاحظات التوصيل (اختياري)<textarea {...register("notes")} rows={3} /></label></div>
      </section>
      <section className="checkout-card"><div className="checkout-card-title"><span>٢</span><div><h2>طريقة الدفع</h2><p>آمنة وبسيطة عند استلام طلبك</p></div></div><label className="payment-option"><input type="radio" checked readOnly /><Banknote size={20} /><span><b>الدفع نقداً عند الاستلام</b><small>ادفعي للمندوب بعد استلام الطلب</small></span><i /></label><p className="muted-note">الدفع الإلكتروني غير متاح حتى ربط مزود دفع معتمد.</p></section>
    </div>
        <aside className="checkout-summary"><h2>ملخص طلبك</h2>{items.map(({ product, quantity, key, variantName, priceModifier }) => <div className="checkout-line" key={key}><span>{product.name}{variantName ? " · " + variantName : ""} × {quantity}</span><strong>{formatPrice((getDisplayPrice(product) + priceModifier) * quantity)}</strong></div>)}<div className="coupon-row"><input {...register("coupon")} placeholder="كود الخصم" /><span>يُتحقق منه عند الإرسال</span></div><div className="summary-total"><span>المجموع الحالي</span><strong>{formatPrice(subtotal)}</strong></div><p className="muted-note"><MapPin size={14} /> رسوم التوصيل يحسبها المتجر حسب المحافظة.</p>{message && <p className="form-message" role="status">{message}</p>}<button className="button button-primary button-wide" disabled={busy || !items.length}>{busy ? "جارٍ تأكيد الطلب..." : "تأكيد الطلب"}</button><p className="privacy-copy">بتأكيد الطلب، توافقين على شروط الاستخدام وسياسة الخصوصية.</p></aside>
  </form>;
}
