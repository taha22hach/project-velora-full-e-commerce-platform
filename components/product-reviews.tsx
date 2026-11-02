"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(120).optional(), reviewBody: z.string().trim().min(5, "اكتبي رأيك في ٥ أحرف على الأقل").max(2000) });
type Values = z.infer<typeof schema>;
type Review = { id: string; rating: number; title: string | null; review_body: string; created_at: string };

export function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { rating: 5, title: "", reviewBody: "" } });
  const { register, handleSubmit, formState: { errors }, reset } = form;
  async function submit(values: Values) {
    setBusy(true);
    const supabase = createClient();
    if (!supabase) { setMessage("إضافة التقييم تحتاج إعداد Supabase."); setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("سجّلي الدخول واكتبي تقييمك بعد استلام المنتج."); setBusy(false); return; }
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating: values.rating,
      title: values.title || null,
      review_body: values.reviewBody,
      status: "pending",
    });
    setMessage(error ? (error.code === "23505" ? "سبق أن أرسلتِ تقييماً لهذا المنتج." : "يمكن للعملاء الذين استلموا المنتج إضافة تقييم.") : "شكراً لكِ. سيظهر تقييمك بعد مراجعته.");
    if (!error) reset();
    setBusy(false);
  }
  return <section className="product-reviews">
    <div className="reviews-header"><div><span className="eyebrow">آراء مجتمع VELORA</span><h2>تجارب حقيقية، اختيار أجمل</h2><p>{reviews.length} تقييم معتمد</p></div><span className="reviews-average"><Star size={16} fill="currentColor" /> {reviews.length ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1) : "—"}</span></div>
    <div className="reviews-layout"><div className="review-list">{reviews.length ? reviews.map((review) => <article className="review-card" key={review.id}><div><span className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span><small>{new Date(review.created_at).toLocaleDateString("ar-EG")}</small></div>{review.title && <h3>{review.title}</h3>}<p>{review.review_body}</p><span className="review-author">عميلة VELORA</span></article>) : <p className="muted-note">كوني أول من يشارك رأيه بعد تجربة المنتج.</p>}</div>
      <form className="review-form" onSubmit={handleSubmit(submit)}><h3>شاركينا تجربتك</h3><label>تقييمك<select {...register("rating")}><option value={5}>٥ نجوم — أعجبني كثيراً</option><option value={4}>٤ نجوم — جيد جداً</option><option value={3}>٣ نجوم — جيد</option><option value={2}>نجمتان — مقبول</option><option value={1}>نجمة — لم يناسبني</option></select></label><label>عنوان مختصر (اختياري)<input {...register("title")} maxLength={120} /></label><label>رأيك<textarea rows={4} {...register("reviewBody")} />{errors.reviewBody && <small>{errors.reviewBody.message}</small>}</label>{message && <p className="form-message" role="status">{message}</p>}<button className="button button-outline" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال التقييم"}</button><Link href="/login?next=/account/orders" className="review-login">يلزم تسجيل الدخول وإتمام استلام المنتج.</Link></form></div>
  </section>;
}
