"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

export function ProductGrid({ products: allProducts, title = "كل المنتجات", description = "اختيارات VELORA صُممت لترافق كل تفاصيلك" }: { products: Product[]; title?: string; description?: string }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [saleOnly, setSaleOnly] = useState(false);
  const perPage = 8;

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("ar");
    const list = allProducts.filter((product) =>
      (!value || [product.name, product.category, product.brand].some((text) => text.toLocaleLowerCase("ar").includes(value))) &&
      (!saleOnly || product.salePrice !== null)
    );
    if (sort === "price-low") list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === "price-high") list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "newest") list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return list;
  }, [allProducts, query, saleOnly, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const shown = filtered.slice((page - 1) * perPage, page * perPage);
  return <section className="page-wrap catalog-section">
    <div className="section-heading catalog-heading"><div><span className="eyebrow">تشكيلة VELORA</span><h1>{title}</h1><p>{description}</p></div><span className="result-count">{filtered.length} منتج</span></div>
    <div className="catalog-toolbar">
      <label className="catalog-search"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ابحثي بالاسم أو العلامة..." /></label>
      <button className={"filter-toggle" + (saleOnly ? " active-filter" : "")} onClick={() => { setSaleOnly((value) => !value); setPage(1); }}><SlidersHorizontal size={16} /> عروض خاصة</button>
      <label className="sort-select">ترتيب حسب<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="featured">الأكثر رواجاً</option><option value="newest">الأحدث</option><option value="rating">الأعلى تقييماً</option><option value="price-low">السعر: الأقل أولاً</option><option value="price-high">السعر: الأعلى أولاً</option></select></label>
    </div>
    {shown.length > 0 ? <div className="product-grid">{shown.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="empty-state"><span>⌕</span><h2>لم نجد نتائج مطابقة</h2><p>جربي البحث بكلمة أخرى أو أزيلي الفلاتر.</p><button className="button button-outline" onClick={() => { setQuery(""); setSaleOnly(false); }}>عرض كل المنتجات</button></div>}
    {pages > 1 && <div className="pagination">{Array.from({ length: pages }, (_, index) => <button onClick={() => { setPage(index + 1); window.scrollTo({ top: 420, behavior: "smooth" }); }} className={page === index + 1 ? "current-page" : ""} key={index}>{index + 1}</button>)}</div>}
  </section>;
}
