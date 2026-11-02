"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AdminCouponActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function toggle() {
    setBusy(true);
    const response = await fetch("/api/admin/coupons/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    if (response.ok) router.refresh();
    setBusy(false);
  }
  return <button className="table-small-action" disabled={busy} onClick={toggle}>{isActive ? "إيقاف" : "تفعيل"}</button>;
}
