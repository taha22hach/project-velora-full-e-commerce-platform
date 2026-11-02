"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
const statuses = [["new", "جديد"], ["confirmed", "مؤكد"], ["processing", "قيد التجهيز"], ["shipped", "تم الشحن"], ["delivered", "تم التوصيل"], ["cancelled", "ملغي"]];
export function AdminOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function change(value: string) {
    const response = await fetch("/api/admin/orders/" + orderId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) });
    const result = await response.json();
    setMessage(response.ok ? "تم" : result.error || "تعذر التحديث");
    if (response.ok) router.refresh();
  }
  return <div className="table-action-wrap"><select aria-label="تحديث حالة الطلب" value={status} onChange={(event) => change(event.target.value)}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{message && <small>{message}</small>}</div>;
}
