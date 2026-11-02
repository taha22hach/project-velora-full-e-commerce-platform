import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductDetail } from "@/components/product-detail";
import { getProducts } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { ProductReviews } from "@/components/product-reviews";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();
  const supabase = await createClient();
  const { data: reviews } = supabase ? await supabase.from("reviews").select("id,rating,title,review_body,created_at").eq("product_id", product.id).eq("status", "approved").order("created_at", { ascending: false }).limit(30) : { data: [] };
  const related = products.filter((entry) => entry.categorySlug === product.categorySlug && entry.id !== product.id).slice(0, 4);
  return <><ProductDetail product={product} /><section className="page-wrap related-section"><div className="section-heading"><div><span className="eyebrow">اختيارات من نفس العالم</span><h2>قد يعجبك أيضاً</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section><div className="page-wrap"><ProductReviews productId={product.id} reviews={reviews || []} /></div></>;
}
