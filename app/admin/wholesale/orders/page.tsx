import { requireAdmin } from "@/lib/auth";
import { AdminOrderTable } from "@/components/admin-order-table";
import type { OrderSummaryRow } from "@/lib/query-types";
export default async function AdminWholesaleOrdersPage() {
  const { supabase } = await requireAdmin();
  const { data: rawData } = await supabase!.from("orders").select("id,order_number,status,total_amount,created_at,profiles(full_name,email),order_items(id)").eq("order_type","wholesale").order("created_at",{ascending:false}).limit(200);
  const data = rawData as unknown as OrderSummaryRow[] | null;
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">مبيعات الأعمال</span><h1>طلبات الجملة</h1><p>سجل منفصل لطلبات التجار المعتمدين.</p></div></div><AdminOrderTable orders={data || []} wholesale /></div>;
}
