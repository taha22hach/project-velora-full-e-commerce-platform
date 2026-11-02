import { requireAdmin } from "@/lib/auth";
import { AdminReviewActions } from "@/components/admin-review-actions";
import type { ReviewAdminRow } from "@/lib/query-types";
export default async function AdminReviewsPage() {
  const { supabase } = await requireAdmin();
  const { data: rawData } = await supabase!.from("reviews").select("id,rating,title,review_body,status,created_at,products(name)").order("created_at",{ascending:false}).limit(100);
  const data = rawData as unknown as ReviewAdminRow[] | null;
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">تجارب العملاء</span><h1>تقييمات المنتجات</h1><p>مراجعة التقييمات قبل عرضها في صفحات المنتجات.</p></div></div><div className="admin-review-list">{data?.map((review) => <section className="admin-panel admin-review-card" key={review.id}><div className="admin-review-heading"><div><b>{review.products && !Array.isArray(review.products) ? review.products.name : "منتج"}</b><span>عميلة VELORA · {new Date(review.created_at).toLocaleDateString("ar-EG")}</span></div><span className={"status-pill status-" + review.status}>{review.status === "approved" ? "معتمد" : review.status === "rejected" ? "مرفوض" : "قيد المراجعة"}</span></div><div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div>{review.title && <h3>{review.title}</h3>}<p>{review.review_body}</p><AdminReviewActions id={review.id} status={review.status} /></section>)}</div>{!data?.length && <div className="admin-panel admin-empty">لا توجد تقييمات حالياً.</div>}</div>;
}
