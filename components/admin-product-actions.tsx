"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
type ProductVariant = { id: string; name: string; sku: string; options: Record<string, string>; priceModifier: number; stock: number };
type CatalogOption = { id: string; name: string };
export function AdminProductActions({ product, categories, brands }: { product: { id: string; name: string; description: string; slug: string; sku: string; category_id: string; brand_id: string | null; minimum_wholesale_quantity: number; variants: ProductVariant[]; is_active: boolean; retail_price: number; sale_price: number | null; wholesale_price: number | null }; categories: CatalogOption[]; brands: CatalogOption[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function update(body: object) {
    setBusy(true);
    const response = await fetch("/api/admin/products/" + product.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    setMessage(response.ok ? "تم" : result.error || "تعذر التحديث");
    if (response.ok) router.refresh();
    setBusy(false);
  }
  async function editPrices() {
    const retailRaw = window.prompt("سعر التجزئة الجديد (ج.م)", String(product.retail_price));
    if (retailRaw === null) return;
    const retailPrice = Number(retailRaw);
    const saleRaw = window.prompt("سعر العرض (اتركيه فارغاً لإزالته)", product.sale_price === null ? "" : String(product.sale_price));
    if (saleRaw === null) return;
    const wholesaleRaw = window.prompt("سعر الجملة (اتركيه فارغاً لإزالته)", product.wholesale_price === null ? "" : String(product.wholesale_price));
    if (wholesaleRaw === null) return;
    await update({ retailPrice, salePrice: saleRaw ? Number(saleRaw) : null, wholesalePrice: wholesaleRaw ? Number(wholesaleRaw) : null });
  }
  async function editDetails() {
    const name = window.prompt("اسم المنتج", product.name);
    if (!name?.trim()) return;
    const description = window.prompt("وصف المنتج", product.description);
    if (description === null) return;
    await update({ name: name.trim(), description });
  }
  async function saveCatalog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await update({
      slug: String(form.get("slug") || ""),
      sku: String(form.get("sku") || ""),
      categoryId: String(form.get("categoryId") || ""),
      brandId: String(form.get("brandId") || "") || null,
      minimumWholesaleQuantity: Number(form.get("minimumWholesaleQuantity")),
    });
  }
  async function editVariants() {
    const initial = JSON.stringify(product.variants, null, 2);
    const raw = window.prompt("عدّلي الخيارات بصيغة JSON. اتركي المصفوفة فارغة لحذف كل الخيارات.", initial);
    if (raw === null) return;
    let variants: unknown;
    try { variants = JSON.parse(raw); } catch { setMessage("صيغة JSON غير صحيحة."); return; }
    if (!Array.isArray(variants)) { setMessage("يجب إدخال قائمة خيارات بصيغة JSON."); return; }
    setBusy(true);
    const response = await fetch("/api/admin/products/" + product.id + "/variants", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variants }) });
    const result = await response.json();
    setMessage(response.ok ? "تم حفظ خيارات المنتج." : result.error || "تعذر حفظ الخيارات.");
    if (response.ok) router.refresh();
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm("سيحذف هذا المنتج وصوره ومخزونه. هل تتابعين؟")) return;
    setBusy(true);
    const response = await fetch("/api/admin/products/" + product.id, { method: "DELETE" });
    const result = await response.json();
    setMessage(response.ok ? "تم الحذف" : result.error || "تعذر الحذف");
    if (response.ok) router.refresh();
    setBusy(false);
  }
  return <div className="admin-product-controls"><div className="admin-row-actions"><button disabled={busy} onClick={editDetails}>تعديل الاسم والوصف</button><button disabled={busy} onClick={editPrices}>تعديل الأسعار</button><button disabled={busy} onClick={editVariants}>إدارة الخيارات</button><button disabled={busy} onClick={() => update({ isActive: !product.is_active })}>{product.is_active ? "إيقاف" : "تفعيل"}</button><button disabled={busy} onClick={remove}>حذف</button>{message && <small role="status">{message}</small>}</div><details className="admin-edit-details"><summary>حقول الكتالوج</summary><form onSubmit={saveCatalog}><label>رمز SKU<input name="sku" defaultValue={product.sku} required dir="ltr" /></label><label>الرابط التعريفي<input name="slug" defaultValue={product.slug} required dir="ltr" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label>التصنيف<select name="categoryId" defaultValue={product.category_id} required>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>العلامة التجارية<select name="brandId" defaultValue={product.brand_id || ""}><option value="">VELORA</option>{brands.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>الحد الأدنى للجملة<input name="minimumWholesaleQuantity" type="number" min="1" defaultValue={product.minimum_wholesale_quantity} required /></label><button className="button button-outline" disabled={busy}>حفظ الحقول</button></form></details></div>;
}
