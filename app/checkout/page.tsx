import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
export const metadata: Metadata = { title: "إتمام الطلب" };
export default function CheckoutPage() {
  return <main className="page-wrap checkout-page"><div className="section-heading"><div><span className="eyebrow">آمنة وبكل سهولة</span><h1>إتمام الطلب</h1><p>أكملي بيانات التوصيل واشتري كزائرة دون إنشاء حساب.</p></div><Link href="/cart" className="text-link">العودة للسلة</Link></div><CheckoutForm /></main>;
}
