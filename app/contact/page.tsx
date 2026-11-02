import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "تواصلي معنا" };
export default async function ContactPage() {
  const supabase = await createClient();
  const { data: branding } = supabase ? await supabase.rpc("public_store_branding") : { data: null };
  const contact = branding?.contact || {};
  const phone = contact.phone || "16688";
  const email = contact.email || "hello@velora.eg";
  const city = contact.city || "القاهرة، مصر";
  return <main className="page-wrap contact-page">
    <div className="contact-heading"><span className="eyebrow">فريق VELORA هنا لمساعدتك</span><h1>يسعدنا أن نسمع منكِ.</h1><p>للاستفسار عن المنتجات أو الطلبات أو برنامج الأعمال، تواصلي معنا بالطريقة الأقرب لكِ.</p></div>
    <div className="contact-cards">
      <a href={"tel:" + phone}><span><Phone /></span><small>اتصلي بنا</small><b dir="ltr">{phone}</b><span>يومياً، ١٠ ص — ١٠ م</span></a>
      <a href={"mailto:" + email}><span><Mail /></span><small>راسلينا</small><b dir="ltr">{email}</b><span>نرد خلال يوم عمل</span></a>
      <a href={"mailto:" + email + "?subject=VELORA%20Support"}><span><Mail /></span><small>رسالة سريعة</small><b>اكتبي لنا</b><span>للمساعدة في طلبك</span></a>
      <div><span><MapPin /></span><small>مقرنا</small><b>{city}</b><span>خدمة توصيل لكل المحافظات</span></div>
    </div>
    <div className="contact-support"><h2>تحتاجين مساعدة بطلبك؟</h2><p>سجّلي الدخول لمتابعة الطلبات أو تواصلي معنا عبر الهاتف أو البريد.</p><Link className="button button-outline" href="/account/orders">متابعة طلباتي <ArrowLeft size={16} /></Link></div>
  </main>;
}
