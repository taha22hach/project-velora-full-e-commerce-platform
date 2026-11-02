import { requireAdmin } from "@/lib/auth";
import { AdminCategoryForm } from "@/components/admin-category-form";
import { AdminCategoryActions } from "@/components/admin-category-actions";
import type { CategoryAdminRow } from "@/lib/query-types";
export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data: rawData } = await supabase!.from("categories").select("id,name,slug,description,sort_order,is_active,products(id)").order("sort_order");
  const data = rawData as unknown as CategoryAdminRow[] | null;
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">تنظيم الكتالوج</span><h1>التصنيفات</h1><p>إنشاء التصنيفات وترتيبها وإخفاء المجموعات غير المنشورة.</p></div></div><section className="admin-panel admin-form-panel"><AdminCategoryForm /></section><section className="admin-panel recent-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>التصنيف</th><th>الرابط</th><th>المنتجات</th><th>الترتيب</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{data?.map((category) => <tr key={category.id}><td><b>{category.name}</b></td><td dir="ltr">{category.slug}</td><td>{category.products?.length ?? 0}</td><td>{category.sort_order}</td><td>{category.is_active ? "ظاهر" : "مخفي"}</td><td><AdminCategoryActions id={category.id} name={category.name} description={category.description} isActive={category.is_active} sortOrder={category.sort_order} hasProducts={Boolean(category.products?.length)} /></td></tr>)}</tbody></table></div></section></div>;
}
