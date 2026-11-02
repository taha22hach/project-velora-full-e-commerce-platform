import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Leaf, PackageCheck, Sparkles, Store } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Newsletter } from "@/components/newsletter";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const featured = products.filter((product) => product.isBestSeller || product.salePrice).slice(0, 4);
  const newest = products.filter((product) => product.isNew).slice(0, 4);
  const newSelection = newest.length ? newest : products.slice(4, 8);
  return <>
    <section className="hero page-wrap">
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> عناية تُشبهك</span><h1>جمالك، أسلوبك،<br /><em>اختيارك.</em></h1><p>تفاصيل صغيرة تصنع شعوراً مختلفاً. اختاري ما يشبهك من عالم VELORA للجمال والأناقة.</p><div className="hero-actions"><Link className="button button-primary" href="/shop">اكتشفي التشكيلة <ArrowLeft size={16} /></Link><Link className="text-link" href="/about">حكاية VELORA <ArrowUpLeft size={16} /></Link></div><div className="hero-note"><span className="hero-note-stars">★★★★★</span><span>اختيارات تحبها أكثر من ١٢ ألف عميلة</span></div></div>
      <div className="hero-art"><div className="hero-photo" role="img" aria-label="مجموعة منتجات عناية وجمال" /><div className="hero-float"><span>لحظتكِ الجميلة</span><strong>تبدأ من هنا</strong><i>✳</i></div><div className="hero-stamp">VELORA <span>BEAUTY<br />& STYLE</span></div></div>
    </section>
    <div className="trust-strip page-wrap"><div><Leaf size={19} /><span><b>اختيارات بعناية</b><small>جودة تليق بكِ</small></span></div><div><PackageCheck size={19} /><span><b>توصيل لكل مصر</b><small>لغاية باب بيتك</small></span></div><div><Sparkles size={19} /><span><b>تفاصيل تحبينها</b><small>تجربة تسوق لطيفة</small></span></div><div><Store size={19} /><span><b>للأفراد والأعمال</b><small>خيارات تسوق مرنة</small></span></div></div>
    <section className="page-wrap category-section"><div className="section-heading"><div><span className="eyebrow">اختاري عالمك</span><h2>ما الذي تبحثين عنه؟</h2><p>كل ما تحبينه، في مكان واحد</p></div><Link className="text-link" href="/shop">كل المنتجات <ArrowLeft size={15} /></Link></div><div className="category-grid">{categories.map((category, index) => <Link href={"/categories/" + category.slug} className={"category-tile category-tile-" + index} key={category.id}><span className="category-photo" style={{ backgroundImage: "url('" + category.image + "')" }} /><span className="category-title"><b>{category.name}</b><small>اكتشفي المجموعة <ArrowLeft size={13} /></small></span></Link>)}</div></section>
    <section className="featured-section"><div className="page-wrap"><div className="section-heading"><div><span className="eyebrow">محبوبات VELORA</span><h2>الأكثر اختياراً</h2><p>قطع ومنتجات عادت عميلاتنا إليها مرة بعد مرة.</p></div><Link className="text-link" href="/shop">اكتشفي المزيد <ArrowLeft size={15} /></Link></div><div className="product-grid">{(featured.length ? featured : products.slice(0, 4)).map((product) => <ProductCard product={product} key={product.id} />)}</div></div></section>
    <section className="editorial-banner page-wrap"><div className="editorial-image" role="img" aria-label="إطلالة أنيقة من VELORA" /><div className="editorial-copy"><span className="eyebrow">الجمال في تفاصيلك</span><h2>لحظاتك اليومية،<br />بطريقتك الخاصة.</h2><p>روتين عناية بسيط، إطلالة تحبينها، وتفاصيل تعبّر عنك. ابدئي حكايتك مع VELORA.</p><Link className="button button-outline" href="/shop">اختاري ما يشبهك <ArrowLeft size={16} /></Link></div><span className="editorial-mark">V.</span></section>
    <section className="page-wrap new-arrivals"><div className="section-heading"><div><span className="eyebrow">وصل حديثاً</span><h2>إضافات جديدة لروتينك</h2><p>اكتشفي آخر اختياراتنا لكِ.</p></div><Link className="text-link" href="/shop">تسوقي المجموعة <ArrowLeft size={15} /></Link></div><div className="product-grid">{newSelection.map((product) => <ProductCard product={product} key={product.id} />)}</div></section>
    <section className="wholesale-banner"><div className="wholesale-pattern">VELORA BUSINESS · VELORA BUSINESS ·</div><div className="page-wrap wholesale-content"><span className="eyebrow">VELORA للأعمال</span><h2>مشروعك يستحق<br />اختيارات أجمل.</h2><p>أسعار جملة ومزايا مخصصة لمتاجر التجميل والصالونات بعد اعتماد حساب الأعمال.</p><Link className="button button-light" href="/wholesale">تعرّفي على برنامج الجملة <ArrowLeft size={16} /></Link></div></section>
    <Newsletter />
  </>;
}
