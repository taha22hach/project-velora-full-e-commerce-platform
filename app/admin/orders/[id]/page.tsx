import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/data";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import type { Relation } from "@/lib/query-types";

type AdminOrderDetail = {
  id: string;
  order_number: string;
  order_type: "b2c" | "wholesale";
  status: OrderStatus;
  subtotal: number | string;
  discount_total: number | string;
  shipping_fee: number | string;
  total_amount: number | string;
  payment_method: string;
  created_at: string;
  profiles: Relation<{ full_name: string; email: string; phone: string | null }>;
  addresses: Relation<{ recipient_name: string; phone: string; governorate: string | null; city: string; area: string; street: string; notes: string | null }>;
  order_items: { id: string; product_name: string; sku: string; quantity: number; unit_price: number | string; line_total: number | string }[];
  payments: Relation<{ provider: string; amount: number | string; status: string; created_at: string }>;
};

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { supabase }] = await Promise.all([params, requireAdmin()]);
  const { data: rawOrder } = await supabase!.from("orders").select("id,order_number,order_type,status,subtotal,discount_total,shipping_fee,total_amount,payment_method,created_at,profiles(full_name,email,phone),addresses(recipient_name,phone,governorate,city,area,street,notes),order_items(id,product_name,sku,quantity,unit_price,line_total),payments(provider,amount,status,created_at)").eq("id", id).maybeSingle();
  const order = rawOrder as unknown as AdminOrderDetail | null;
  if (!order) notFound();
  const customer = order.profiles && !Array.isArray(order.profiles) ? order.profiles : null;
  const address = order.addresses && !Array.isArray(order.addresses) ? order.addresses : null;
  const payments = order.payments ? (Array.isArray(order.payments) ? order.payments : [order.payments]) : [];

  return <div className="admin-content"><div className="admin-page-heading"><div><Link className="breadcrumb" href="/admin/orders"><ArrowLeft size={14} /> جميع الطلبات</Link><span className="eyebrow">{order.order_type === "wholesale" ? "طلب جملة" : "طلب تجزئة"} · {new Date(order.created_at).toLocaleString("ar-EG")}</span><h1>{order.order_number}</h1><p>{customer?.full_name || address?.recipient_name || customer?.email || "عميل"} · {customer?.phone || address?.phone || "لا يوجد رقم هاتف"}</p></div><AdminOrderActions orderId={order.id} status={order.status} /></div>
    <div className="admin-dashboard-grid"><section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>بيانات التوصيل</h2><p>العنوان المسجل عند إتمام الطلب</p></div></div>{address ? <div className="address-card"><div><b>{address.recipient_name} · {address.phone}</b><p>{address.governorate ? `${address.governorate}، ` : ""}{address.city}، {address.area}</p><small>{address.street}</small>{address.notes && <small>ملاحظة: {address.notes}</small>}</div></div> : <div className="admin-empty">لا يوجد عنوان لهذا الطلب.</div>}</section><section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>الدفع</h2><p>{order.payment_method === "cash_on_delivery" ? "الدفع عند الاستلام" : order.payment_method}</p></div></div>{payments.map((payment) => <div className="admin-payment-row" key={payment.created_at}><span>{payment.provider}</span><span>{payment.status === "pending" ? "معلق" : payment.status}</span><b>{formatPrice(Number(payment.amount))}</b></div>)}</section></div>
    <section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>المنتجات</h2><p>تفاصيل عناصر الطلب</p></div><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status]}</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>المنتج</th><th>SKU</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>{order.order_items.map((item) => <tr key={item.id}><td>{item.product_name}</td><td dir="ltr">{item.sku}</td><td>{item.quantity}</td><td>{formatPrice(Number(item.unit_price))}</td><td>{formatPrice(Number(item.line_total))}</td></tr>)}</tbody></table></div><div className="admin-order-totals"><p><span>المجموع</span><b>{formatPrice(Number(order.subtotal))}</b></p><p><span>الخصم</span><b>- {formatPrice(Number(order.discount_total))}</b></p><p><span>التوصيل</span><b>{formatPrice(Number(order.shipping_fee))}</b></p><p className="summary-total"><span>الإجمالي</span><strong>{formatPrice(Number(order.total_amount))}</strong></p></div></section>
  </div>;
}
