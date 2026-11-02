"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Check, MapPin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ fullName: z.string().trim().min(2, "الاسم مطلوب"), phone: z.string().trim().min(8, "رقم الهاتف غير مكتمل").max(24) });
const addressSchema = z.object({ recipientName: z.string().trim().min(2), phone: z.string().trim().min(8).max(24), city: z.string().trim().min(2), area: z.string().trim().min(2), street: z.string().trim().min(3), notes: z.string().max(300).optional() });
type Address = { id: string; recipient_name: string; phone: string; city: string; area: string; street: string; notes: string | null; is_default: boolean };
type Profile = { id: string; full_name: string; phone: string | null; email: string };

export function ProfileForm({ profile, addresses }: { profile: Profile; addresses: Address[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");
  const [addressBusy, setAddressBusy] = useState(false);
  const router = useRouter();
  const profileForm = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { fullName: profile.full_name || "", phone: profile.phone || "" } });
  const addressForm = useForm<z.infer<typeof addressSchema>>({ resolver: zodResolver(addressSchema), defaultValues: { recipientName: profile.full_name || "", phone: profile.phone || "", city: "", area: "", street: "", notes: "" } });

  async function saveProfile(values: { fullName: string; phone: string }) {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase!.from("profiles").update({ full_name: values.fullName, phone: values.phone }).eq("id", profile.id);
    setMessage(error ? "تعذر حفظ البيانات." : "تم حفظ بياناتك.");
    router.refresh();
    setBusy(false);
  }
  async function addAddress(values: z.infer<typeof addressSchema>) {
    setAddressBusy(true);
    setAddressMessage("");
    const supabase = createClient();
    if (!supabase) { setAddressMessage("أضيفي إعدادات Supabase لإدارة العناوين."); setAddressBusy(false); return; }
    const first = addresses.length === 0;
    const { error } = await supabase.from("addresses").insert({
      user_id: profile.id,
      recipient_name: values.recipientName,
      phone: values.phone,
      city: values.city,
      area: values.area,
      street: values.street,
      notes: values.notes || null,
      is_default: first,
    });
    setAddressMessage(error ? "تعذر إضافة العنوان. حاولي مرة أخرى." : "تمت إضافة العنوان.");
    if (!error) { addressForm.reset({ recipientName: profile.full_name, phone: profile.phone || "", city: "", area: "", street: "", notes: "" }); router.refresh(); }
    setAddressBusy(false);
  }
  async function setDefault(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.rpc("set_default_address", { p_address_id: id });
    if (error) setAddressMessage("تعذر تحديث العنوان الافتراضي.");
    else router.refresh();
  }
  async function removeAddress(id: string) {
    if (!window.confirm("حذف عنوان التوصيل؟")) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) setAddressMessage("تعذر حذف العنوان.");
    else router.refresh();
  }

  return <div className="profile-management">
    <form className="checkout-card profile-edit-card" onSubmit={profileForm.handleSubmit(saveProfile)}><div className="checkout-card-title"><span>١</span><div><h2>بيانات الحساب</h2><p>بريد الدخول: {profile.email}</p></div></div><div className="form-grid"><label>الاسم الكامل<input {...profileForm.register("fullName")} />{profileForm.formState.errors.fullName && <small>{profileForm.formState.errors.fullName.message}</small>}</label><label>رقم الهاتف<input dir="ltr" {...profileForm.register("phone")} />{profileForm.formState.errors.phone && <small>{profileForm.formState.errors.phone.message}</small>}</label></div>{message && <p className="form-message">{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ التغييرات"} <Check size={15} /></button></form>
    <section className="profile-addresses"><div className="section-heading"><div><span className="eyebrow">توصيل أسهل</span><h2>عناوين التوصيل</h2><p>احتفظي بأكثر من عنوان واختاري الافتراضي.</p></div><MapPin size={20} /></div>{addresses.map((address) => <article className="saved-address" key={address.id}><div><b>{address.recipient_name}</b>{address.is_default && <span className="status-pill status-approved">افتراضي</span>}<p>{address.phone} · {address.city}، {address.area}<br />{address.street}{address.notes ? " · " + address.notes : ""}</p></div><div className="address-actions">{!address.is_default && <button className="table-small-action" onClick={() => setDefault(address.id)}>جعله افتراضياً</button>}<button className="remove-button" onClick={() => removeAddress(address.id)} aria-label="حذف العنوان"><Trash2 size={15} /></button></div></article>)}{!addresses.length && <p className="muted-note">أضيفي عنواناً ليكون جاهزاً في طلبك القادم.</p>}
      <form className="checkout-card address-create-form" onSubmit={addressForm.handleSubmit(addAddress)}><h3>إضافة عنوان جديد</h3><div className="form-grid"><label>اسم المستلم<input {...addressForm.register("recipientName")} /></label><label>رقم الهاتف<input dir="ltr" {...addressForm.register("phone")} /></label><label>المحافظة<input {...addressForm.register("city")} /></label><label>المنطقة<input {...addressForm.register("area")} /></label><label className="full-field">العنوان بالتفصيل<input {...addressForm.register("street")} /></label><label className="full-field">ملاحظات<textarea rows={2} {...addressForm.register("notes")} /></label></div>{addressMessage && <p className="form-message">{addressMessage}</p>}<button className="button button-outline" disabled={addressBusy}>{addressBusy ? "جارٍ الإضافة..." : "حفظ العنوان"}</button></form>
    </section>
  </div>;
}
