"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Option = { id: string; name: string };
export function AdminProductForm({ categories, brands }: { categories: Option[]; brands: Option[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(formData: FormData) {
    setBusy(true);
    setMessage("");
    let variants: unknown[] = [];
    try {
      variants = String(formData.get("variants") || "").trim() ? JSON.parse(String(formData.get("variants"))) : [];
      if (!Array.isArray(variants)) throw new Error("invalid");
    } catch {
      setMessage("صيغة خيارات المنتج غير صحيحة. استخدمي مصفوفة JSON.");
      setBusy(false);
      return;
    }
    const bodyBase = {
      name: String(formData.get("name") || ""),
      slug: String(formData.get("slug") || ""),
      sku: String(formData.get("sku") || ""),
      description: String(formData.get("description") || ""),
      categoryId: String(formData.get("categoryId") || ""),
      brandId: String(formData.get("brandId") || "") || null,
      price: Number(formData.get("price")),
      salePrice: formData.get("salePrice") ? Number(formData.get("salePrice")) : null,
      wholesalePrice: formData.get("wholesalePrice") ? Number(formData.get("wholesalePrice")) : null,
      stock: Number(formData.get("stock")),
      minimumWholesaleQuantity: Number(formData.get("minimumWholesaleQuantity") || 1),
      variants,
    };
    const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length > 8 || files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setMessage("اختاري حتى ٨ صور بصيغة JPG أو PNG أو WebP، بحجم لا يتجاوز ٥ ميجابايت للصورة.");
      setBusy(false);
      return;
    }
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    const images: { url: string; storagePath: string }[] = [];
    if (files.length && !supabase) {
      setMessage("رفع الصور يحتاج إعداد Supabase.");
      setBusy(false);
      return;
    }
    for (const file of files) {
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = "products/" + crypto.randomUUID() + "." + extension;
      const { error } = await supabase!.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        if (uploadedPaths.length) await supabase!.storage.from("product-images").remove(uploadedPaths);
        setMessage("تعذر رفع صورة. تأكدي من صلاحية حساب المدير ومن إعدادات التخزين.");
        setBusy(false);
        return;
      }
      uploadedPaths.push(path);
      images.push({ url: supabase!.storage.from("product-images").getPublicUrl(path).data.publicUrl, storagePath: path });
    }
    const externalImage = String(formData.get("imageUrl") || "");
    const body = { ...bodyBase, images, imageUrl: externalImage };
    const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    setMessage(response.ok ? "تمت إضافة المنتج بنجاح." : result.error || "تعذر إضافة المنتج.");
    if (!response.ok && uploadedPaths.length) await supabase?.storage.from("product-images").remove(uploadedPaths);
    if (response.ok) { (document.getElementById("product-create-form") as HTMLFormElement)?.reset(); router.refresh(); }
    setBusy(false);
  }
  return <form id="product-create-form" className="admin-create-form" action={submit}>
    <h2>إضافة منتج</h2><p>تتحقق الخوادم من البيانات والأسعار قبل حفظ المنتج.</p>
    <div className="form-grid"><label>اسم المنتج<input name="name" required minLength={2} /></label><label>الرابط التعريفي<input name="slug" required pattern="[a-z0-9-]+" placeholder="velora-glow-cleanser" dir="ltr" /></label><label>رمز SKU<input name="sku" required dir="ltr" /></label><label>التصنيف<select name="categoryId" required defaultValue=""><option value="" disabled>اختاري تصنيفاً</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>العلامة التجارية<select name="brandId" defaultValue=""><option value="">VELORA</option>{brands.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>سعر التجزئة (ج.م)<input name="price" type="number" min="0.01" step="0.01" required /></label><label>سعر العرض (اختياري)<input name="salePrice" type="number" min="0.01" step="0.01" /></label><label>سعر الجملة (اختياري)<input name="wholesalePrice" type="number" min="0.01" step="0.01" /></label><label>المخزون الابتدائي (اتركيه ٠ عند استخدام الخيارات)<input name="stock" type="number" min="0" required defaultValue="0" /></label><label>أقل كمية للجملة<input name="minimumWholesaleQuantity" type="number" min="1" required defaultValue="6" /></label><label className="full-field">خيارات المنتج بصيغة JSON (اختياري)<textarea name="variants" rows={3} placeholder={'[{"name":"S","sku":"VLR-1009-S","options":{"size":"S"},"priceModifier":0,"stock":4}]'} dir="ltr" /></label><label className="full-field">صور المنتج (حتى ٨ صور، ٥ ميجابايت للصورة)<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label><label className="full-field">أو رابط صورة خارجي<input name="imageUrl" type="url" placeholder="https://..." dir="ltr" /></label><label className="full-field">الوصف<textarea name="description" rows={3} /></label></div>
    {message && <p className="form-message" role="status">{message}</p>}<button className="button button-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ المنتج"}</button>
  </form>;
}
