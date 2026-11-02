import { requireAdmin } from "@/lib/auth";
import { AdminCouponForm } from "@/components/admin-coupon-form";
import { AdminCouponActions } from "@/components/admin-coupon-actions";
import type { CouponAdminRow } from "@/lib/query-types";
export default async function AdminCouponsPage() {
  const { supabase } = await requireAdmin();
  const { data: rawData } = await supabase!.from("coupons").select("id,code,discount_type,discount_value,minimum_order,starts_at,expires_at,usage_limit,per_customer_limit,used_count,is_active").order("created_at",{ascending:false});
  const data = rawData as unknown as CouponAdminRow[] | null;
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">الحملات والعروض</span><h1>كوبونات الخصم</h1><p>إنشاء أكواد بحدود استخدام وفترة صلاحية.</p></div></div><section className="admin-panel admin-form-panel"><AdminCouponForm /></section><section className="admin-panel recent-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>الكود</th><th>الخصم</th><th>حد الطلب</th><th>الاستخدام</th><th>الصلاحية</th><th>الحالة</th><th /></tr></thead><tbody>{data?.map((coupon) => <tr key={coupon.id}><td><b dir="ltr">{coupon.code}</b></td><td>{coupon.discount_type === "percentage" ? coupon.discount_value + "%" : coupon.discount_value + " ج.م"}</td><td>{coupon.minimum_order} ج.م</td><td>{coupon.used_count} / {coupon.usage_limit ?? "∞"}</td><td>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("ar-EG") : "دون انتهاء"}</td><td>{coupon.is_active ? "نشط" : "متوقف"}</td><td><AdminCouponActions id={coupon.id} isActive={coupon.is_active} /></td></tr>)}</tbody></table>{!data?.length && <div className="admin-empty">لم تتم إضافة كوبونات بعد.</div>}</div></section></div>;
}
