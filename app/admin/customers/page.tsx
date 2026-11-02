import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminCustomerAction } from "@/components/admin-customer-action";
import type { CustomerAdminRow } from "@/lib/query-types";
export default async function AdminCustomersPage() {
  const { supabase } = await requireAdmin();
  const { data: rawCustomers } = await supabase!.from("profiles").select("id,email,full_name,phone,role,is_active,created_at").neq("role","admin").order("created_at",{ascending:false}).limit(200);
  const customers = rawCustomers as unknown as CustomerAdminRow[] | null;
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">مجتمع VELORA</span><h1>العملاء</h1><p>مراجعة حسابات العملاء والتجار وإدارة حالة الدخول.</p></div></div><section className="admin-panel recent-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>العميل</th><th>البريد الإلكتروني</th><th>الهاتف</th><th>نوع الحساب</th><th>تاريخ التسجيل</th><th>الحالة</th><th /></tr></thead><tbody>{customers?.map((customer) => <tr key={customer.id}><td><Link href={"/admin/customers/" + customer.id}><b>{customer.full_name || "—"}</b></Link></td><td dir="ltr">{customer.email}</td><td dir="ltr">{customer.phone || "—"}</td><td>{customer.role === "merchant" ? "تاجر معتمد" : "عميل"}</td><td>{new Date(customer.created_at).toLocaleDateString("ar-EG")}</td><td><span className={"status-pill " + (customer.is_active ? "status-delivered" : "status-cancelled")}>{customer.is_active ? "نشط" : "معلق"}</span></td><td><AdminCustomerAction id={customer.id} isActive={customer.is_active} /></td></tr>)}</tbody></table>{!customers?.length && <div className="admin-empty">لا توجد حسابات بعد.</div>}</div></section></div>;
}
