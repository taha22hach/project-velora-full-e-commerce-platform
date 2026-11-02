"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AdminCustomerAction({ id, isActive }: { id: string; isActive: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function toggle() {
    setBusy(true);
    await fetch("/api/admin/customers/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    router.refresh();
    setBusy(false);
  }
  return <button className="table-small-action" disabled={busy} onClick={toggle}>{isActive ? "تعليق" : "تفعيل"}</button>;
}
