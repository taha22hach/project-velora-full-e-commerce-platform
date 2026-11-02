"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function InventoryAdjustment({ productId, variantId, current }: { productId: string; variantId: string | null; current: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function adjust() {
    const change = Number(window.prompt("أدخلي فرق المخزون: موجب للإضافة وسالب للخصم", "1"));
    if (!Number.isInteger(change) || change === 0) return;
    const reason = change > 0 ? "restock" : "adjustment";
    setBusy(true);
    const response = await fetch("/api/admin/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, variantId, change, reason, notes: "تعديل يدوي من لوحة الإدارة" }) });
    const result = await response.json();
    if (!response.ok) window.alert(result.error || "تعذر تعديل المخزون.");
    else { window.alert("المخزون الجديد: " + result.quantity); router.refresh(); }
    setBusy(false);
  }
  return <button className="table-small-action" disabled={busy} onClick={adjust}>تعديل · {current}</button>;
}
