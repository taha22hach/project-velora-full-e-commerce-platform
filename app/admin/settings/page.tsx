import { requireAdmin } from "@/lib/auth";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import type { StoreSettingRow, StoreSettingValue } from "@/lib/query-types";
export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const { data: rawData } = await supabase!.from("store_settings").select("setting_key,setting_value");
  const rows = rawData as unknown as StoreSettingRow[] | null;
  const values = new Map<string, StoreSettingValue>((rows || []).map((row) => {
    const value = row.setting_value;
    const setting = typeof value === "object" && value !== null && !Array.isArray(value) ? value as StoreSettingValue : {};
    return [row.setting_key, setting];
  }));
  const store = values.get("store") || {};
  const contact = values.get("contact") || {};
  const shipping = values.get("shipping") || {};
  const social = values.get("social") || {};
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">إدارة التجربة</span><h1>إعدادات المتجر</h1><p>اسم المتجر والشعار وبيانات التواصل والشحن.</p></div></div><section className="admin-panel admin-form-panel"><AdminSettingsForm initial={{ storeName: store.name || "VELORA", phone: contact.phone || "16688", email: contact.email || "hello@velora.eg", city: contact.city || "القاهرة، مصر", flatShippingFee: Number(shipping.flat_fee ?? 60), freeShippingMinimum: Number(shipping.free_shipping_minimum ?? 1500), instagram: social.instagram || "", facebook: social.facebook || "", logoUrl: store.logo_url || "", logoStoragePath: store.logo_storage_path || null }} /></section><section className="admin-panel payment-settings"><h2>الدفع الإلكتروني</h2><p>غير مفعّل. أضيفي تكامل مزود دفع موثوقاً ومفاتيحه كمتغيرات بيئة سرية قبل تفعيل الدفع الإلكتروني. بطاقات الدفع لا تُخزن في VELORA.</p></section></div>;
}
