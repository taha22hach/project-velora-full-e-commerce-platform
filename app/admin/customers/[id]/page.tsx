import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { AdminCustomerAction } from "@/components/admin-customer-action";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/data";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import type { OrderSummaryRow } from "@/lib/query-types";

type Customer = { id: string; email: string; full_name: string; phone: string | null; role: string; is_active: boolean; created_at: string };
type Address = { id: string; label: string; recipient_name: string; phone: string; city: string; area: string; street: string };

export default async function AdminCustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { supabase }] = await Promise.all([params, requireAdmin()]);
  const [profileResult, addressResult, orderResult] = await Promise.all([
    supabase!.from("profiles").select("id,email,full_name,phone,role,is_active,created_at").eq("id", id).maybeSingle(),
    supabase!.from("addresses").select("id,label,recipient_name,phone,city,area,street").eq("user_id", id).order("created_at", { ascending: false }),
    supabase!.from("orders").select("id,order_number,status,total_amount,created_at,order_items(id)").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  const customer = profileResult.data as unknown as Customer | null;
  if (!customer || customer.role === "admin") notFound();
  const addresses = addressResult.data as unknown as Address[] | null;
  const orders = orderResult.data as unknown as OrderSummaryRow[] | null;

  return <div className="admin-content"><div className="admin-page-heading"><div><Link className="breadcrumb" href="/admin/customers"><ArrowLeft size={14} /> جميع العملاء</Link><span className="eyebrow">ملف العميل</span><h1>{customer.full_name || customer.email}</h1><p>{customer.email} · {customer.phone || "لا يوجد رقم هاتف"}</p></div><AdminCustomerAction id={customer.id} isActive={customer.is_active} /></div>
    <div className="admin-metrics"><div className="admin-metric"><span className="metric-label">نوع الحساب</span><strong>{customer.role === "merchant" ? "تاجر معتمد" : "عميل"}</strong></div><div className="admin-metric"><span className="metric-label">حالة الحساب</span><strong>{customer.is_active ? "نشط" : "معلق"}</strong></div><div className="admin-metric"><span className="metric-label">تاريخ التسجيل</span><strong>{new Date(customer.created_at).toLocaleDateString("ar-EG")}</strong></div><div className="admin-metric"><span className="metric-label">عدد الطلبات</span><strong>{orders?.length ?? 0}</strong></div></div>
    <section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>عناوين التوصيل</h2><p>العناوين المسجلة لهذا الحساب</p></div></div>{addresses?.length ? <div className="address-list">{addresses.map((address) => <article className="address-card" key={address.id}><MapPin size={17} /><div><b>{address.label || address.recipient_name}</b><p>{address.recipient_name} · {address.phone}</p><small>{address.city}، {address.area}، {address.street}</small></div></article>)}</div> : <div className="admin-empty">لا توجد عناوين مسجلة.</div>}</section>
    <section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>سجل الطلبات</h2><p>طلبات العميل السابقة</p></div></div>{orders?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>عدد المنتجات</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link href={"/admin/orders/" + order.id}><b>{order.order_number}</b></Link></td><td>{new Date(order.created_at).toLocaleDateString("ar-EG")}</td><td>{order.order_items?.length ?? 0}</td><td>{formatPrice(Number(order.total_amount))}</td><td><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status as OrderStatus]}</span></td></tr>)}</tbody></table></div> : <div className="admin-empty"><Package size={18} /> لا توجد طلبات مسجلة.</div>}</section>
  </div>;
}
