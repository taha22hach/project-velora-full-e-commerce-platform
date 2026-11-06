import type { Metadata } from "next";
import Link from "next/link";
import { verifyGuestOrderConfirmation } from "@/lib/guest-checkout";

export const metadata: Metadata = {
  title: "تأكيد الطلب",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function GuestOrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; token?: string }>;
}) {
  const { orderId, token } = await searchParams;
  const isValidOrderId = Boolean(orderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId));
  const orderNumber = isValidOrderId && token
    ? await verifyGuestOrderConfirmation(orderId!, token)
    : null;

  return <main className="page-wrap account-page">
    {orderNumber ? <>
      <span className="eyebrow">تم استلام طلبك</span>
      <h1>شكراً لاختيارك VELORA</h1>
      <p>رقم طلبك هو <strong dir="ltr">{orderNumber}</strong>. سنراجع الطلب ونتواصل معك لتأكيد التوصيل.</p>
    </> : <>
      <span className="eyebrow">تأكيد الطلب</span>
      <h1>تعذر التحقق من الطلب</h1>
      <p>رابط التأكيد غير صالح أو انتهت صلاحيته. إذا أتممت الطلب، تواصلي مع خدمة العملاء.</p>
    </>}
    <div className="hero-actions">
      <Link href="/shop" className="button button-primary">متابعة التسوق</Link>
      <Link href="/contact" className="button button-outline">تواصلي معنا</Link>
    </div>
  </main>;
}
