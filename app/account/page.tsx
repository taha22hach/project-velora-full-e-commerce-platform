import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, Heart, Package, UserRound, Building2 } from "lucide-react";
import { getUserProfile } from "@/lib/auth";

export default async function AccountPage() {
  const { user, profile } = await getUserProfile();
  if (!user) redirect("/login?next=/account");
  return <main className="page-wrap account-page"><span className="eyebrow">حساب VELORA</span><h1>أهلاً بكِ{profile?.full_name ? "، " + profile.full_name : ""}</h1><p>من هنا يمكنك متابعة مشترياتك وحفظ اختياراتك.</p><div className="account-links"><Link href="/account/orders"><Package /><span><b>طلباتي</b><small>تفاصيل وحالة طلباتك</small></span><ArrowLeft /></Link>{profile?.role === "merchant" && <Link href="/account/wholesale/orders"><Building2 /><span><b>طلبات الجملة</b><small>سجل مشتريات حساب الأعمال</small></span><ArrowLeft /></Link>}<Link href="/account/wishlist"><Heart /><span><b>قائمة أمنياتي</b><small>المنتجات التي حفظتها</small></span><ArrowLeft /></Link><Link href="/account/profile"><UserRound /><span><b>بياناتي وعناويني</b><small>الحساب وعناوين التوصيل</small></span><ArrowLeft /></Link><Link href="/account/notifications"><Bell /><span><b>الإشعارات</b><small>تحديثات الطلب والحساب</small></span><ArrowLeft /></Link><a href={"mailto:" + user.email}><UserRound /><span><b>بريد الحساب</b><small>{user.email}</small></span><ArrowLeft /></a></div><form action="/api/auth/signout" method="post"><button className="text-link signout-link">تسجيل الخروج</button></form></main>;
}
