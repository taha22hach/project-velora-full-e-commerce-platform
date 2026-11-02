"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPrice, getDisplayPrice } from "@/lib/data";

export function CartPage() {
  const { items, update, remove } = useCart();
  const subtotal = items.reduce((sum, item) => sum + (getDisplayPrice(item.product) + item.priceModifier) * item.quantity, 0);
  return <main className="page-wrap cart-page">
    <div className="section-heading"><div><span className="eyebrow">خطوة أقرب إليك</span><h1>سلة التسوق</h1><p>راجعي اختياراتك قبل إتمام طلبك.</p></div></div>
    {items.length === 0 ? <div className="empty-state"><ShoppingBag size={37} /><h2>سلتك بانتظار اختياراتك</h2><p>اكتشفي قطعاً ومنتجات تحبينها في VELORA.</p><Link className="button button-primary" href="/shop">تسوقي الآن <ArrowLeft size={16} /></Link></div> :
      <div className="cart-layout"><div className="cart-items">{items.map((item) => {
        const { product, quantity, key, variantId, variantName, priceModifier } = item;
        const stock = product.variants?.find((variant) => variant.id === variantId)?.stock ?? product.stock;
        const unitPrice = getDisplayPrice(product) + priceModifier;
        return <article className="cart-item" key={key}>
          <Link className="cart-item-image" href={"/products/" + product.slug} style={{ backgroundImage: "url('" + product.image + "')" }} />
          <div className="cart-item-info"><span className="eyebrow">{product.brand}</span><Link href={"/products/" + product.slug}>{product.name}</Link>{variantName && <small className="cart-variant">{variantName}</small>}<span>{formatPrice(unitPrice)}</span><div className="quantity-control"><button aria-label="تقليل" onClick={() => update(key, quantity - 1)}><Minus size={13} /></button><span>{quantity}</span><button aria-label="زيادة" disabled={quantity >= stock} onClick={() => update(key, quantity + 1)}><Plus size={13} /></button></div></div>
          <div className="cart-item-end"><strong>{formatPrice(unitPrice * quantity)}</strong><button className="remove-button" onClick={() => remove(key)} aria-label="حذف من السلة"><Trash2 size={16} /></button></div>
        </article>;
      })}</div><aside className="cart-summary"><h2>ملخص الطلب</h2><div><span>المجموع الفرعي</span><strong>{formatPrice(subtotal)}</strong></div><div><span>الشحن</span><span>{subtotal >= 1500 ? "مجاناً" : "يحسب عند الدفع"}</span></div><div className="summary-total"><span>الإجمالي</span><strong>{formatPrice(subtotal)}</strong></div><Link href="/checkout" className="button button-primary button-wide">إتمام الطلب <ArrowLeft size={17} /></Link><p>الدفع عند الاستلام متاح حالياً.</p><Link className="continue-shopping" href="/shop">متابعة التسوق</Link></aside></div>}
  </main>;
}
