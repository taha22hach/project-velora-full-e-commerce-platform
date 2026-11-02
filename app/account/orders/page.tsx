import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/data";
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const [{ user, supabase }, query] = await Promise.all([getUserProfile(), searchParams]);
  if (!user) redirect("/login?next=/account/orders");
  const { data: orders } = await supabase!.from("orders").select("id,order_number,status,total_amount,currency,created_at,order_items(id)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  return <main className="page-wrap account-page orders-page"><Link className="breadcrumb" href="/account"><ArrowLeft size={14} /> حسابي</Link><span className="eyebrow">سجل مشترياتك</span><h1>طلباتي</h1>{query.placed && <div className="order-confirmation">تم استلام طلبك رقم {query.placed}. شكراً لاختيارك VELORA.</div>}
    {!orders?.length ? <div className="empty-state"><PackageOpen size={35} /><h2>لا توجد طلبات حتى الآن</h2><p>ستظهر طلباتك هنا بعد تأكيد الشراء.</p><Link href="/shop" className="button button-primary">ابدئي التسوق <ArrowLeft size={15} /></Link></div> : <div className="orders-list">{orders.map((order) => <Link key={order.id} href={"/account/orders/" + order.id} className="order-row"><span><small>رقم الطلب</small><b>{order.order_number}</b></span><span><small>التاريخ</small><b>{new Date(order.created_at).toLocaleDateString("ar-EG")}</b></span><span><small>المنتجات</small><b>{order.order_items?.length || 0}</b></span><span><small>الإجمالي</small><b>{formatPrice(Number(order.total_amount))}</b></span><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status as OrderStatus]}</span></Link>)}</div>}
  </main>;
}
