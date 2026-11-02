"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function AdminCategoryForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(formData: FormData) {
    setBusy(true);
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: String(formData.get("name") || ""), slug: String(formData.get("slug") || ""), description: String(formData.get("description") || ""), imageUrl: String(formData.get("imageUrl") || ""), sortOrder: Number(formData.get("sortOrder") || 0) }) });
    const result = await response.json();
    setMessage(response.ok ? "تم إنشاء التصنيف." : result.error || "تعذر الإنشاء.");
    if (response.ok) { (document.getElementById("category-form") as HTMLFormElement)?.reset(); router.refresh(); }
    setBusy(false);
  }
  return <form id="category-form" className="admin-create-form" action={submit}><h2>إضافة تصنيف</h2><div className="form-grid"><label>الاسم<input name="name" required /></label><label>الرابط التعريفي<input name="slug" required dir="ltr" placeholder="body-care" /></label><label>رابط صورة البانر<input type="url" name="imageUrl" dir="ltr" /></label><label>ترتيب العرض<input type="number" name="sortOrder" min="0" defaultValue="0" /></label><label className="full-field">الوصف<input name="description" /></label></div>{message && <p className="form-message">{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ التصنيف"}</button></form>;
}
