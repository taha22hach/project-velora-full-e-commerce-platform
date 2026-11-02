"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AdminCouponForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(formData: FormData) {
    setBusy(true);
    const body = {
      code: String(formData.get("code") || "").trim().toUpperCase(),
      discountType: String(formData.get("discountType")),
      discountValue: Number(formData.get("discountValue")),
      minimumOrder: Number(formData.get("minimumOrder") || 0),
      startsAt: formData.get("startsAt") ? new Date(String(formData.get("startsAt"))).toISOString() : null,
      expiresAt: formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))).toISOString() : null,
      usageLimit: formData.get("usageLimit") ? Number(formData.get("usageLimit")) : null,
      perCustomerLimit: Number(formData.get("perCustomerLimit") || 1),
    };
    const response = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    setMessage(response.ok ? "تم إنشاء الكوبون." : result.error || "تعذر إنشاء الكوبون.");
    if (response.ok) { (document.getElementById("coupon-form") as HTMLFormElement)?.reset(); router.refresh(); }
    setBusy(false);
  }
  return <form id="coupon-form" className="admin-create-form" action={submit}><h2>إنشاء كود خصم</h2><div className="form-grid"><label>كود الخصم<input name="code" required minLength={3} dir="ltr" placeholder="WELCOME10" /></label><label>نوع الخصم<select name="discountType"><option value="percentage">نسبة مئوية</option><option value="fixed">مبلغ ثابت</option></select></label><label>قيمة الخصم<input name="discountValue" type="number" min="0.01" step="0.01" required /></label><label>الحد الأدنى للطلب<input name="minimumOrder" type="number" min="0" defaultValue="0" /></label><label>تاريخ البداية<input name="startsAt" type="datetime-local" /></label><label>تاريخ الانتهاء<input name="expiresAt" type="datetime-local" /></label><label>حد الاستخدام الإجمالي<input name="usageLimit" type="number" min="1" /></label><label>حد الاستخدام للعميل<input name="perCustomerLimit" type="number" min="1" defaultValue="1" /></label></div>{message && <p className="form-message">{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "إنشاء الكوبون"}</button></form>;
}
