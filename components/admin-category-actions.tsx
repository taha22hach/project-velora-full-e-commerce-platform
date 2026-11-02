"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AdminCategoryActions({ id, name, description, isActive, sortOrder, hasProducts }: { id: string; name: string; description: string | null; isActive: boolean; sortOrder: number; hasProducts: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function update(payload: object) {
    setBusy(true);
    const response = await fetch("/api/admin/categories/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) window.alert(result.error || "تعذر تحديث التصنيف.");
    else router.refresh();
    setBusy(false);
  }
  async function remove() {
    if (hasProducts || !window.confirm("حذف هذا التصنيف؟")) return;
    setBusy(true);
    const response = await fetch("/api/admin/categories/" + id, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) window.alert(result.error || "تعذر حذف التصنيف.");
    else router.refresh();
    setBusy(false);
  }
  return <div className="admin-row-actions"><button disabled={busy} onClick={() => { const nextName = window.prompt("اسم التصنيف", name); if (nextName?.trim()) { const nextDescription = window.prompt("وصف التصنيف", description || ""); if (nextDescription !== null) update({ name: nextName.trim(), description: nextDescription }); } }}>تعديل</button><button disabled={busy} onClick={() => update({ isActive: !isActive })}>{isActive ? "إخفاء" : "نشر"}</button><button disabled={busy} onClick={() => { const raw = window.prompt("ترتيب التصنيف (الأصغر يظهر أولاً)", String(sortOrder)); if (raw === null || raw.trim() === "") return; const order = Number(raw); if (Number.isFinite(order)) update({ sortOrder: order }); }}>ترتيب</button><button disabled={busy || hasProducts} onClick={remove}>حذف</button></div>;
}
