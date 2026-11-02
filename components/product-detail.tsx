"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, ShieldCheck, RotateCcw, Check } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, getDisplayPrice } from "@/lib/data";
import type { Product } from "@/lib/types";

export function ProductDetail({ product }: { product: Product }) {
  const { add, wishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const [added, setAdded] = useState(false);
  const saved = wishlist.includes(product.id);
  const selectedVariant = product.variants?.find((variant) => variant.id === variantId);
  const stock = selectedVariant?.stock ?? product.stock;
  const unitPrice = getDisplayPrice(product) + (selectedVariant?.priceModifier ?? 0);
  function addToCart() {
    for (let index = 0; index < quantity; index += 1) add(product, selectedVariant);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }
  return <div className="page-wrap product-detail-layout">
    <div className="product-detail-image" style={{ backgroundImage: "url('" + product.image + "')" }} role="img" aria-label={product.name} />
    <div className="product-detail-copy">
      <div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><Link href={"/categories/" + product.categorySlug}>{product.category}</Link><span>/</span><span>{product.name}</span></div>
      <span className="eyebrow">{product.brand}</span>
      <h1>{product.name}</h1>
      <div className="rating-row"><span className="stars"><Star size={15} fill="currentColor" /> {product.rating.toFixed(1)}</span><span>{product.reviewCount} تقييم</span><span>·</span><span>رمز المنتج: {product.sku}</span></div>
      <div className="detail-price">{(product.wholesalePrice || product.salePrice) && <del>{formatPrice(product.price + (selectedVariant?.priceModifier ?? 0))}</del>}<strong>{formatPrice(unitPrice)}</strong></div>
      {product.wholesalePrice && <p className="wholesale-price-label">سعر خاص لحساب الأعمال المعتمد</p>}
      <p className="detail-description">{product.description}</p>
      {product.variants?.length ? <label className="variant-picker">اختاري المقاس أو اللون<select value={variantId} onChange={(event) => { setVariantId(event.target.value); setQuantity(1); }}><option value="" disabled>اختاري الخيار</option>{product.variants.map((variant) => <option disabled={variant.stock < 1} value={variant.id} key={variant.id}>{variant.name}{variant.stock < 1 ? " — غير متوفر" : ""}</option>)}</select></label> : null}
      <div className="availability"><i className={stock > 0 ? "in-stock" : "out-stock"} />{stock > 0 ? "متوفر — " + stock + " قطعة" : "غير متوفر حالياً"}</div>
      <div className="purchase-row"><div className="quantity-control"><button aria-label="تقليل الكمية" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)}><Minus size={15} /></button><span>{quantity}</span><button aria-label="زيادة الكمية" disabled={quantity >= stock} onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div><button className="button button-primary add-detail" disabled={stock < 1 || Boolean(product.variants?.length && !selectedVariant)} onClick={addToCart}>{added ? <><Check size={17} /> أضيفت للسلة</> : <><ShoppingBag size={17} /> أضيفي إلى السلة</>}</button><button onClick={() => toggleWishlist(product.id)} className={"detail-favorite" + (saved ? " is-saved" : "")} aria-label="المفضلة"><Heart size={19} fill={saved ? "currentColor" : "none"} /></button></div>
      <div className="detail-perks"><div><Truck size={19} /><span><b>توصيل لباب البيت</b><small>لكل محافظات مصر</small></span></div><div><ShieldCheck size={19} /><span><b>اختيارات موثوقة</b><small>منتجات أصلية بعناية</small></span></div><div><RotateCcw size={19} /><span><b>استبدال سهل</b><small>خلال ١٤ يوماً</small></span></div></div>
      <div className="wholesale-note">تبحثين عن أسعار الجملة؟ <Link href="/wholesale">اكتشفي برنامج VELORA للأعمال</Link></div>
    </div>
  </div>;
}
