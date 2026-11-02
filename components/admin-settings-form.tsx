"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
type Settings = { storeName: string; phone: string; email: string; city: string; flatShippingFee: number; freeShippingMinimum: number; instagram: string; facebook: string; logoUrl: string; logoStoragePath: string | null };
export function AdminSettingsForm({ initial }: { initial: Settings }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(formData: FormData) {
    setBusy(true);
    setMessage("");
    const file = formData.get("logo") as File | null;
    const supabase = createClient();
    let logoUrl = initial.logoUrl;
    let logoStoragePath = initial.logoStoragePath;
    if (file && file.size > 0) {
      if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
        setMessage("اختاري شعاراً بصيغة JPG أو PNG أو WebP وبحجم أقل من ٥ ميجابايت.");
        setBusy(false);
        return;
      }
      if (!supabase) {
        setMessage("رفع الشعار يحتاج إعداد Supabase.");
        setBusy(false);
        return;
      }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = "branding/" + crypto.randomUUID() + "." + extension;
      const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        setMessage("تعذر رفع الشعار. تحققي من صلاحيات التخزين.");
        setBusy(false);
        return;
      }
      logoUrl = supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
      logoStoragePath = path;
    }
    const body = {
      storeName: String(formData.get("storeName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      city: String(formData.get("city") || ""),
      flatShippingFee: Number(formData.get("flatShippingFee")),
      freeShippingMinimum: Number(formData.get("freeShippingMinimum")),
      instagram: String(formData.get("instagram") || ""),
      facebook: String(formData.get("facebook") || ""),
      logoUrl,
      logoStoragePath,
    };
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    setMessage(response.ok ? "تم حفظ إعدادات المتجر." : result.error || "تعذر الحفظ.");
    if (!response.ok && file && file.size > 0 && logoStoragePath && logoStoragePath !== initial.logoStoragePath) await supabase?.storage.from("store-assets").remove([logoStoragePath]);
    if (response.ok) router.refresh();
    setBusy(false);
  }
  return <form className="admin-create-form" action={submit}><div className="form-grid"><label>اسم المتجر<input name="storeName" defaultValue={initial.storeName} required /></label><label>رقم التواصل<input name="phone" defaultValue={initial.phone} /></label><label>البريد الإلكتروني<input type="email" name="email" defaultValue={initial.email} required dir="ltr" /></label><label>المدينة / العنوان<input name="city" defaultValue={initial.city} /></label><label>رسوم التوصيل (ج.م)<input type="number" min="0" name="flatShippingFee" defaultValue={initial.flatShippingFee} /></label><label>الشحن المجاني فوق (ج.م)<input type="number" min="0" name="freeShippingMinimum" defaultValue={initial.freeShippingMinimum} /></label><label>إنستغرام<input name="instagram" defaultValue={initial.instagram} dir="ltr" /></label><label>فيسبوك<input name="facebook" defaultValue={initial.facebook} dir="ltr" /></label><label>شعار المتجر (PNG/JPG/WebP، حتى ٥ ميجابايت)<input name="logo" type="file" accept="image/jpeg,image/png,image/webp" /></label></div>{initial.logoUrl && <p className="logo-preview-note">تم رفع شعار المتجر. ارفعي صورة جديدة لاستبداله.</p>}<p className="muted-note">لا تحفظي مفاتيح الدفع أو الأسرار في إعدادات المتجر. ضعيها كمتغيرات بيئة سرية بعد ربط مزود دفع.</p>{message && <p className="form-message">{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</button></form>;
}
