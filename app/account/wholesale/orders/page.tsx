import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { formatPrice } from "@/lib/data";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import type { OrderSummaryRow } from "@/lib/query-types";
export default async function MerchantOrdersPage() {
  const { user, profile, supabase } = await getUserProfile();
  if (!user) redirect("/login?next=/account/wholesale/orders");
  if (profile?.role !== "merchant") redirect("/wholesale");
  const { data: rawData } = await supabase!.from("orders").select("id,order_number,status,total_amount,created_at,order_items(id)").eq("user_id",user.id).eq("order_type","wholesale").order("created_at",{ascending:false});
  const data = rawData as unknown as OrderSummaryRow[] | null;
  return <main className="page-wrap account-page"><Link className="breadcrumb" href="/account"><ArrowLeft size={14} /> حسابي</Link><span className="eyebrow">حساب الأعمال</span><h1>طلبات الجملة</h1>{data?.length ? <div className="orders-list">{data.map((order) => <Link key={order.id} href={"/account/orders/" + order.id} className="order-row"><span><small>رقم الطلب</small><b>{order.order_number}</b></span><span><small>التاريخ</small><b>{new Date(order.created_at).toLocaleDateString("ar-EG")}</b></span><span><small>المنتجات</small><b>{order.order_items?.length ?? 0}</b></span><span><small>الإجمالي</small><b>{formatPrice(Number(order.total_amount))}</b></span><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status as OrderStatus]}</span></Link>)}</div> : <div className="empty-state"><PackageOpen /><h2>لا توجد طلبات جملة بعد</h2><p>بعد اعتماد الحساب ستظهر طلباتك هنا.</p><Link className="button button-primary" href="/shop">تسوقي الآن</Link></div>}</main>;
}
