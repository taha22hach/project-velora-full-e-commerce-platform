import { requireAdmin } from "@/lib/auth";
import { AdminOrderTable } from "@/components/admin-order-table";
import type { OrderSummaryRow } from "@/lib/query-types";

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: rawOrders, error } = await supabase!
    .from("orders")
    .select(
      "id,order_number,status,total_amount,created_at,profiles(full_name,email,phone),addresses(recipient_name,phone,governorate,city,area,street),order_items(id)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("تعذر تحميل الطلبات: " + error.message);
  }

  const orders = rawOrders as unknown as OrderSummaryRow[] | null;

  return (
    <div className="admin-content">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">المبيعات</span>
          <h1>الطلبات</h1>
          <p>مراجعة الطلبات وتحديث حالة التنفيذ.</p>
        </div>
      </div>

      <AdminOrderTable orders={orders || []} />
    </div>
  );
}
