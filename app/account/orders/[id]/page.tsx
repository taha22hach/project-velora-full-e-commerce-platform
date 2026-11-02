import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { formatPrice } from "@/lib/data";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import type { OrderDetailRow } from "@/lib/query-types";
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { user, supabase }] = await Promise.all([params, getUserProfile()]);
  if (!user) redirect("/login?next=/account/orders");
  const { data: rawOrder } = await supabase!.from("orders").select("*,order_items(id,product_name,sku,quantity,unit_price,line_total)").eq("id", id).eq("user_id", user.id).maybeSingle();
  const order = rawOrder as unknown as OrderDetailRow | null;
  if (!order) notFound();
  return <main className="page-wrap account-page"><Link className="breadcrumb" href="/account/orders"><ArrowLeft size={14} /> جميع الطلبات</Link><div className="order-detail-heading"><PackageCheck size={28} /><div><span className="eyebrow">تتبع الطلب</span><h1>{order.order_number}</h1></div><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status as OrderStatus]}</span></div><div className="order-detail-card"><div className="order-timeline"><span className="timeline-dot active" /><div><b>تم استلام الطلب</b><small>{new Date(order.created_at).toLocaleString("ar-EG")}</small></div><span className={"timeline-dot " + (["confirmed","processing","shipped","delivered"].includes(order.status) ? "active" : "")} /><div><b>التجهيز والتوصيل</b><small>ستظهر التحديثات هنا</small></div></div><div className="order-detail-items">{order.order_items?.map((item) => <div key={item.id}><span>{item.product_name} × {item.quantity}</span><b>{formatPrice(Number(item.line_total))}</b></div>)}<div className="summary-total"><span>الإجمالي</span><strong>{formatPrice(Number(order.total_amount))}</strong></div></div></div></main>;
}
