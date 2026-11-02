"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Product, ProductVariant } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export type CartItem = { product: Product; variantId?: string; variantName?: string; priceModifier: number; key: string; quantity: number };
type CartContextValue = {
  items: CartItem[];
  wishlist: string[];
  count: number;
  subtotal: number;
  add: (product: Product, variant?: ProductVariant) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  toggleWishlist: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "velora-cart-v1";
const WISHLIST_KEY = "velora-wishlist-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [syncUserId, setSyncUserId] = useState<string | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const hydratedUser = useRef<string | null>(null);
  const hydratedWishlistUser = useRef<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as CartItem[];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted client state is the external-store hydration step.
      setItems(saved.map((item) => ({ ...item, priceModifier: item.priceModifier || 0, key: item.key || item.product.id + ":" + (item.variantId || "base"), product: { ...item.product, wholesalePrice: null } })));
      setWishlist(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"));
    } catch {
      setItems([]);
      setWishlist([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items.map((item) => ({ ...item, product: { ...item.product, wholesalePrice: null } }))));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    async function hydrateRemoteCart() {
      const supabase = createClient();
      if (!supabase) { setRemoteReady(true); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        hydratedUser.current = null;
        hydratedWishlistUser.current = null;
        setSyncUserId(null);
        setRemoteReady(true);
        setItems((current) => current.map((item) => ({ ...item, product: { ...item.product, wholesalePrice: null } })));
        return;
      }
      setSyncUserId(user.id);
      if (hydratedUser.current !== user.id) {
        const response = await fetch("/api/cart", { cache: "no-store" });
        if (response.ok && active) {
          const result = await response.json();
          if (Array.isArray(result.items) && result.items.length) setItems(result.items);
        }
        hydratedUser.current = user.id;
      }
      if (hydratedWishlistUser.current !== user.id) {
        const response = await fetch("/api/wishlist", { cache: "no-store" });
        if (response.ok && active) {
          const result = await response.json();
          if (Array.isArray(result.productIds) && result.productIds.length) setWishlist(result.productIds);
        }
        hydratedWishlistUser.current = user.id;
      }
      if (active) setRemoteReady(true);
    }
    void hydrateRemoteCart();
    return () => { active = false; };
  }, [ready, pathname]);

  useEffect(() => {
    if (!ready || !remoteReady || !syncUserId) return;
    const timer = window.setTimeout(async () => {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((item) => ({ productId: item.product.id, variantId: item.variantId || null, quantity: item.quantity })) }),
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [items, ready, remoteReady, syncUserId]);

  useEffect(() => {
    if (!ready || !remoteReady || !syncUserId || hydratedWishlistUser.current !== syncUserId) return;
    const timer = window.setTimeout(async () => {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: wishlist }),
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [wishlist, ready, remoteReady, syncUserId]);

  useEffect(() => {
    if (!ready || !syncUserId || !items.length) return;
    let active = true;
    async function refreshMerchantPrices() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== syncUserId) {
        if (active) setItems((current) => current.map((item) => ({ ...item, product: { ...item.product, wholesalePrice: null } })));
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "merchant") {
        if (active) setItems((current) => current.map((item) => ({ ...item, product: { ...item.product, wholesalePrice: null } })));
        return;
      }
      const { data: prices } = await supabase.rpc("merchant_product_prices");
      if (!active || !prices) return;
      const map = new Map<string, number>(prices.map((row: { product_id: string; wholesale_price: number }) => [row.product_id, Number(row.wholesale_price)]));
      setItems((current) => current.map((item) => ({ ...item, product: { ...item.product, wholesalePrice: map.get(item.product.id) ?? null } })));
    }
    void refreshMerchantPrices();
    return () => { active = false; };
  }, [ready, syncUserId, items.length, pathname]);

  useEffect(() => {
    if (ready) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    wishlist,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + ((item.product.wholesalePrice ?? item.product.salePrice ?? item.product.price) + item.priceModifier) * item.quantity, 0),
    add: (product, variant) => setItems((current) => {
      const key = product.id + ":" + (variant?.id || "base");
      const found = current.find((item) => item.key === key);
      const stock = variant?.stock ?? product.stock;
      if (found) return current.map((item) => item.key === key ? { ...item, quantity: Math.min(item.quantity + 1, stock) } : item);
      return [...current, { product, variantId: variant?.id, variantName: variant?.name, priceModifier: variant?.priceModifier ?? 0, key, quantity: 1 }];
    }),
    update: (key, quantity) => setItems((current) => {
      const item = current.find((line) => line.key === key);
      const stock = item?.product.variants?.find((variant) => variant.id === item.variantId)?.stock ?? item?.product.stock ?? 0;
      return quantity < 1 ? current.filter((line) => line.key !== key) : current.map((line) => line.key === key ? { ...line, quantity: Math.min(quantity, stock) } : line);
    }),
    remove: (key) => setItems((current) => current.filter((item) => item.key !== key)),
    toggleWishlist: (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    clear: () => setItems([]),
  }), [items, wishlist]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
