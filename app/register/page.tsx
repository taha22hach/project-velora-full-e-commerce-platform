import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "تسجيل الحسابات متوقف",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <main className="page-wrap account-page">
    <span className="eyebrow">VELORA</span>
    <h1>تسجيل الحسابات الجديدة متوقف مؤقتاً</h1>
    <p>يمكنك متابعة الشراء كزائرة دون إنشاء حساب. أما الحسابات الحالية فما زال بإمكانها تسجيل الدخول.</p>
    <div className="hero-actions">
      <Link href="/shop" className="button button-primary">تصفحي المتجر</Link>
      <Link href="/login" className="button button-outline">تسجيل الدخول</Link>
    </div>
  </main>;
}
