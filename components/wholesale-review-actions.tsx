"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export function WholesaleReviewActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [minimumQuantity, setMinimumQuantity] = useState("6");
  const router = useRouter();
  async function review(decision: "approved" | "rejected") {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/wholesale/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, discountPercent: Number(discountPercent), minimumQuantity: Number(minimumQuantity) }) });
    const result = await response.json();
    setMessage(response.ok ? "تم تحديث حالة الطلب." : result.error || "تعذر التحديث.");
    if (response.ok) router.refresh();
    setBusy(false);
  }
  return <div className="review-actions"><label>خصم الحساب %<input type="number" min="0" max="80" step="0.5" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} /></label><label>الحد الأدنى للطلب<input type="number" min="1" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} /></label><button className="button button-primary" disabled={busy} onClick={() => review("approved")}>{status === "approved" ? "حفظ شروط الحساب" : "اعتماد الحساب"}</button>{status !== "pending" && <button className="button button-outline" disabled={busy} onClick={() => review("rejected")}>إلغاء الاعتماد</button>}{message && <small role="status">{message}</small>}</div>;
}
