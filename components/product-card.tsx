"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, getDisplayPrice } from "@/lib/data";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { add, wishlist, toggleWishlist } = useCart();
  const saved = wishlist.includes(product.id);
  const price = getDisplayPrice(product);
  return <article className="product-card">
    <div className="product-image-wrap">
      <Link href={"/products/" + product.slug} className="product-image" style={{ backgroundImage: "url('" + product.image + "')" }} aria-label={"عرض " + product.name} />
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <button className={"favorite-button" + (saved ? " is-saved" : "")} aria-label={saved ? "إزالة من المفضلة" : "أضيفي للمفضلة"} onClick={() => toggleWishlist(product.id)}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
      {product.variants?.length ? <Link className="quick-add" href={"/products/" + product.slug}><ShoppingBag size={15} /> اختاري المقاس أو اللون</Link> : <button className="quick-add" onClick={() => add(product)}><ShoppingBag size={15} /> أضيفي للسلة</button>}
    </div>
    <div className="product-copy">
      <div className="product-meta"><span>{product.brand}</span><span><Star size={13} fill="currentColor" /> {product.rating.toFixed(1)} <small>({product.reviewCount})</small></span></div>
      <Link className="product-name" href={"/products/" + product.slug}>{product.name}</Link>
      <div className="product-price">{product.wholesalePrice ? <del>{formatPrice(product.price)}</del> : product.salePrice && <del>{formatPrice(product.price)}</del>}<strong>{formatPrice(price)}</strong></div>
    </div>
  </article>;
}
