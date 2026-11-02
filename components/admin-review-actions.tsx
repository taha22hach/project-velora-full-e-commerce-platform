"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AdminReviewActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function setStatus(value: string) {
    setBusy(true);
    const response = await fetch("/api/admin/reviews/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) });
    if (response.ok) router.refresh();
    else window.alert("تعذر تحديث التقييم.");
    setBusy(false);
  }
  return <div className="admin-row-actions">{status !== "approved" && <button disabled={busy} onClick={() => setStatus("approved")}>اعتماد</button>}{status !== "rejected" && <button disabled={busy} onClick={() => setStatus("rejected")}>رفض</button>}{status !== "pending" && <button disabled={busy} onClick={() => setStatus("pending")}>إعادة للمراجعة</button>}</div>;
}
