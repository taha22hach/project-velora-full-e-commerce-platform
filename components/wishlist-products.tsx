"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";
export function WishlistProducts({ products }: { products: Product[] }) {
  const { wishlist } = useCart();
  const list = products.filter((product) => wishlist.includes(product.id));
  if (!list.length) return <div className="empty-state"><h2>اختياراتك المحفوظة ستظهر هنا</h2><p>احفظي المنتجات التي تحبينها بالضغط على رمز القلب.</p><Link className="button button-primary" href="/shop">اكتشفي المنتجات</Link></div>;
  return <div className="product-grid">{list.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
