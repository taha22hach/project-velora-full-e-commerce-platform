import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgePercent, Boxes, ShieldCheck, Store } from "lucide-react";
import { WholesaleApplication } from "@/components/wholesale-application";
export const metadata: Metadata = { title: "VELORA للأعمال والجملة" };
export default function WholesalePage() {
  return <main className="wholesale-page">
    <section className="wholesale-hero"><div className="page-wrap"><span className="eyebrow">شراكة تنمو معك</span><h1>VELORA<br /><em>للأعمال</em></h1><p>اختيارات جمال وأسلوب بأسعار جملة مخصصة لمتجرك أو صالونك.</p><a href="#apply" className="button button-light">ابدئي طلب الاعتماد <ArrowLeft size={16} /></a></div><span className="wholesale-hero-seal">VELORA<br />BUSINESS</span></section>
    <section className="page-wrap wholesale-benefits"><div><BadgePercent /><b>أسعار مخصصة</b><p>أسعار جملة تظهر فقط لحسابات الأعمال المعتمدة.</p></div><div><Boxes /><b>إدارة طلباتك</b><p>تابعي الكميات وطلبات الجملة من مكان واحد.</p></div><div><ShieldCheck /><b>اعتماد آمن</b><p>معلومات نشاطك محمية وتستخدم لمراجعة الطلب.</p></div><div><Store /><b>متجر وصالون</b><p>برنامج مرن لأصحاب الأعمال في مجال الجمال.</p></div></section>
    <section className="wholesale-application-wrap page-wrap" id="apply"><div className="application-intro"><span className="eyebrow">كيف تبدئين؟</span><h2>خطوتان لعلاقة أجمل</h2><p>سجّلي الدخول بحسابك الشخصي، ثم أرسلي بيانات النشاط. بعد المراجعة، تصلك حالة الطلب داخل حسابك.</p><div className="application-step"><b>١</b><span><strong>أنشئي حسابك أو سجّلي الدخول</strong><small>نحتاج حساباً لتأمين معلومات نشاطك.</small></span></div><div className="application-step"><b>٢</b><span><strong>أرسلي طلب اعتماد النشاط</strong><small>يظهر سعر الجملة بعد موافقة الإدارة.</small></span></div><Link className="text-link" href="/login?next=/wholesale">تسجيل الدخول <ArrowLeft size={15} /></Link></div><WholesaleApplication /></section>
  </main>;
}
