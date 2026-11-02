"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Building2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  businessName: z.string().min(2, "اسم النشاط مطلوب"),
  businessType: z.enum(["beauty_store", "salon", "distributor", "other"]),
  phone: z.string().min(8, "رقم الهاتف غير مكتمل"),
  registrationNumber: z.string().max(80).optional(),
  website: z.union([
    z.url().refine((value) => {
      try {
        return ["https:", "http:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }),
    z.literal(""),
  ]).optional(),
  notes: z.string().max(500).optional(),
});
type Values = z.infer<typeof schema>;

export function WholesaleApplication() {
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { businessName: "", businessType: "beauty_store", phone: "", registrationNumber: "", website: "", notes: "" } });
  const { register, handleSubmit, formState: { errors } } = form;

  async function submit(values: Values) {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("طلبات الجملة تحتاج إعداد Supabase. أضيفي بيانات المشروع في .env.local أولاً.");
      setBusy(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("سجّلي الدخول أولاً بحسابك، ثم أرسلي طلب اعتماد النشاط.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("wholesale_applications").insert({
      user_id: user.id,
      business_name: values.businessName,
      business_type: values.businessType,
      business_phone: values.phone,
      registration_number: values.registrationNumber || null,
      website: values.website || null,
      notes: values.notes || null,
    });
    if (error) setMessage(error.code === "23505" ? "لديك طلب قائم بالفعل. يمكنك التواصل معنا لتحديثه." : "تعذر إرسال الطلب. راجعي بياناتك وحاولي مرة أخرى.");
    else setComplete(true);
    setBusy(false);
  }

  if (complete) return <div className="application-success"><CheckCircle2 size={36} /><h2>وصلنا طلبك بنجاح</h2><p>سيقوم فريق VELORA بمراجعة بيانات النشاط. حالة الطلب تظهر في حسابك بعد تسجيل الدخول.</p></div>;
  return <form className="wholesale-form" onSubmit={handleSubmit(submit)}>
    <div className="wholesale-form-heading"><Building2 size={22} /><div><h2>طلب اعتماد حساب أعمال</h2><p>املئي بيانات النشاط وسيقوم فريقنا بمراجعتها.</p></div></div>
    <div className="form-grid"><label>اسم النشاط التجاري<input {...register("businessName")} />{errors.businessName && <small>{errors.businessName.message}</small>}</label><label>نوع النشاط<select {...register("businessType")}><option value="beauty_store">متجر مستحضرات تجميل</option><option value="salon">صالون تجميل</option><option value="distributor">موزع / تاجر جملة</option><option value="other">أخرى</option></select></label><label>هاتف النشاط<input dir="ltr" {...register("phone")} />{errors.phone && <small>{errors.phone.message}</small>}</label><label>الرقم الضريبي أو التجاري (اختياري)<input dir="ltr" {...register("registrationNumber")} /></label><label className="full-field">الموقع الإلكتروني أو حساب النشاط (اختياري)<input dir="ltr" {...register("website")} /></label><label className="full-field">معلومات إضافية<textarea rows={3} {...register("notes")} /></label></div>
    <p className="wholesale-private-note">تُستخدم بيانات النشاط لمراجعة الأهلية فقط، ولا تظهر للعملاء أو للحسابات الأخرى.</p>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? "جارٍ إرسال الطلب..." : "إرسال طلب الاعتماد"}</button>
  </form>;
}
