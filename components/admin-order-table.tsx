"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { formatPrice } from "@/lib/data";
import { orderStatusLabels, type OrderStatus } from "@/lib/types";
import type { OrderSummaryRow } from "@/lib/query-types";

export function AdminOrderTable({ orders, wholesale = false }: { orders: OrderSummaryRow[]; wholesale?: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return orders.filter((order) => {
      const customer = order.profiles && !Array.isArray(order.profiles) ? order.profiles : null;
      const matchesText = !needle || [order.order_number, customer?.full_name, customer?.email]
        .some((value) => value?.toLocaleLowerCase("ar").includes(needle));
      return matchesText && (status === "all" || order.status === status);
    });
  }, [orders, query, status]);

  return <section className="admin-panel recent-panel"><div className="admin-order-filters"><label><span>بحث</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="رقم الطلب أو اسم العميل أو البريد" /></label><label><span>الحالة</span><select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "all")}><option value="all">كل الحالات</option>{(Object.keys(orderStatusLabels) as OrderStatus[]).map((key) => <option value={key} key={key}>{orderStatusLabels[key]}</option>)}</select></label><small>{filtered.length} طلب</small></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>{wholesale ? "النشاط / العميل" : "العميل"}</th><th>التاريخ</th><th>المنتجات</th><th>الإجمالي</th><th>الحالة</th><th>تحديث</th></tr></thead><tbody>{filtered.map((order) => { const customer = order.profiles && !Array.isArray(order.profiles) ? order.profiles : null; return <tr key={order.id}><td><Link href={"/admin/orders/" + order.id}><b>{order.order_number}</b></Link></td><td>{customer?.full_name || customer?.email || "—"}</td><td>{new Date(order.created_at).toLocaleDateString("ar-EG")}</td><td>{order.order_items?.length ?? 0}</td><td>{formatPrice(Number(order.total_amount))}</td><td><span className={"status-pill status-" + order.status}>{orderStatusLabels[order.status]}</span></td><td><AdminOrderActions orderId={order.id} status={order.status} /></td></tr>; })}</tbody></table>{filtered.length === 0 && <div className="admin-empty">لا توجد طلبات تطابق البحث.</div>}</div></section>;
}
