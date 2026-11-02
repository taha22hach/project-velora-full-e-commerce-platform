import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Boxes, ClipboardList, Package, Users, WalletCards } from "lucide-react";
import { AdminChart } from "@/components/admin-chart";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/data";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import type { OrderSummaryRow } from "@/lib/query-types";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 29);
  const [ordersCount, customersCount, productsCount, merchantsCount, pendingCount, lowStock, ordersResult, salesResult] = await Promise.all([
    supabase!.from("orders").select("id", { count: "exact", head: true }),
    supabase!.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase!.from("products").select("id", { count: "exact", head: true }),
    supabase!.from("profiles").select("id", { count: "exact", head: true }).eq("role", "merchant"),
    supabase!.from("wholesale_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase!.from("inventory").select("product_id,quantity_available,low_stock_threshold,products(name,sku)").limit(1000),
    supabase!.from("orders").select("id,order_number,total_amount,status,created_at,profiles(full_name,email)").order("created_at", { ascending: false }).limit(12),
    supabase!.from("orders").select("total_amount,status,created_at").gte("created_at", since.toISOString()).limit(10000),
  ]);
  const orderRows = (ordersResult.data || []) as unknown as OrderSummaryRow[];
  const salesRows = (salesResult.data || []) as unknown as { total_amount: number | string; status: OrderStatus; created_at: string }[];
  const lowStockRows = (lowStock.data || []) as unknown as { quantity_available: number; low_stock_threshold: number }[];
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() - 29);
  const chart = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(thirtyDays);
    date.setDate(date.getDate() + index);
    const dayKey = date.toISOString().slice(0, 10);
    const amount = salesRows.filter((order) => order.created_at.slice(0, 10) === dayKey && order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total_amount), 0);
    return { day: String(date.getDate()), sales: amount };
  });
  const salesTotal = chart.reduce((sum, row) => sum + row.sales, 0);
  const metrics = [
    { label: "مبيعات آخر ٣٠ يوماً", value: formatPrice(salesTotal), icon: WalletCards, note: "من الطلبات غير الملغاة" },
    { label: "إجمالي الطلبات", value: String(ordersCount.count ?? 0), icon: ClipboardList, note: "جميع الحالات" },
    { label: "العملاء", value: String(customersCount.count ?? 0), icon: Users, note: "حساب عميل نشط" },
    { label: "تجار معتمدون", value: String(merchantsCount.count ?? 0), icon: Package, note: "حسابات أعمال" },
  ];
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">ملخص المتجر</span><h1>أهلاً بك في VELORA</h1><p>إدارة واضحة لكل ما يحدث في متجرك.</p></div><span className="admin-date">{new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</span></div>
    <div className="admin-metrics">{metrics.map(({ label, value, icon: Icon, note }) => <div className="admin-metric" key={label}><span className="metric-icon"><Icon size={19} /></span><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <div className="admin-dashboard-grid"><section className="admin-panel sales-panel"><div className="admin-panel-heading"><div><h2>المبيعات</h2><p>آخر ٣٠ يوماً · حسب تاريخ الطلب</p></div><span className="chart-total">{formatPrice(salesTotal)}</span></div><AdminChart data={chart} /></section><section className="admin-panel quick-panel"><div className="admin-panel-heading"><div><h2>تحتاج انتباهك</h2><p>متابعة سريعة للمتجر</p></div></div><Link href="/admin/wholesale" className="quick-alert"><span className="metric-icon"><Users size={17} /></span><span><b>طلبات جملة قيد المراجعة</b><small>تحتاج اعتماد الإدارة</small></span><strong>{pendingCount.count ?? 0}</strong></Link><Link href="/admin/inventory" className="quick-alert"><span className="metric-icon"><Boxes size={17} /></span><span><b>منتجات بمخزون منخفض</b><small>أقل من ٦ قطع متوفرة</small></span><strong>{lowStockRows.filter((item) => item.quantity_available <= item.low_stock_threshold).length}</strong></Link><Link href="/admin/products" className="quick-alert"><span className="metric-icon"><Package size={17} /></span><span><b>المنتجات المسجلة</b><small>تفعيل وإدارة الكتالوج</small></span><strong>{productsCount.count ?? 0}</strong></Link></section></div>
    <section className="admin-panel recent-panel"><div className="admin-panel-heading"><div><h2>أحدث الطلبات</h2><p>آخر الطلبات الواردة من العملاء</p></div><Link className="text-link" href="/admin/orders">جميع الطلبات <ArrowLeft size={15} /></Link></div>{orderRows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>الحالة</th><th>الإجمالي</th><th /></tr></thead><tbody>{orderRows.slice(0, 7).map((order) => <tr key={order.id}><td><Link href={"/admin/orders/" + order.id}><b>{order.order_number}</b></Link></td><td>{order.profiles && !Array.isArray(order.profiles) ? order.profiles.full_name || order.profiles.email || "—" : "—"}</td><td>{new Date(order.created_at).toLocaleDateString("ar-EG")}</td><td><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status as OrderStatus]}</span></td><td>{formatPrice(Number(order.total_amount))}</td><td><Link href="/admin/orders" aria-label="عرض الطلب"><ArrowUpLeft size={16} /></Link></td></tr>)}</tbody></table></div> : <div className="admin-empty">ستظهر الطلبات هنا بعد أول عملية شراء موصولة بقاعدة البيانات.</div>}</section>
  </div>;
}
