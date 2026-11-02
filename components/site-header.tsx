"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, ShoppingBag, UserRound, Menu, X, Heart, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart-provider";

const links = [
  ["الرئيسية", "/"],
  ["تسوقي الآن", "/shop"],
  ["العناية بالبشرة", "/categories/skincare"],
  ["المكياج", "/categories/makeup"],
  ["الأزياء والإكسسوارات", "/categories/fashion"],
  ["عالم الجملة", "/wholesale"],
];

export function SiteHeader({ logoUrl }: { logoUrl?: string | null }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push("/search?q=" + encodeURIComponent(value));
  }

  return (
    <>
      <div className="announcement"><Sparkles size={14} /> شحن مجاني للطلبات فوق ١٥٠٠ جنيه <span>·</span> دلّلي نفسك اليوم</div>
      <header className="site-header">
        <div className="header-main page-wrap">
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Menu size={21} /></button>
          <Link className="wordmark" href="/" aria-label="VELORA الرئيسية">{logoUrl ? <span className="wordmark-image" role="img" aria-label="شعار VELORA" style={{ backgroundImage: "url('" + logoUrl + "')" }} /> : <span>VELORA</span>}<small>BEAUTY · STYLE · YOU</small></Link>
          <form className="header-search" onSubmit={submitSearch}>
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحثي عن منتجك المفضل..." aria-label="بحث المنتجات" />
            <button type="submit">بحث</button>
          </form>
          <div className="header-actions">
            <Link className="icon-button" href="/account" aria-label="حسابي"><UserRound size={19} /><span className="action-label">حسابي</span></Link>
            <Link className="icon-button" href="/account/wishlist" aria-label="المفضلة"><Heart size={19} /><span className="action-label">المفضلة</span></Link>
            <Link className="icon-button cart-action" href="/cart" aria-label="سلة التسوق"><ShoppingBag size={20} /><span className="cart-count">{count}</span><span className="action-label">السلة</span></Link>
          </div>
        </div>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
      </header>
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
        <nav className="mobile-drawer" onClick={(event) => event.stopPropagation()} aria-label="قائمة الجوال">
          <div className="drawer-top"><Link className="wordmark" href="/" onClick={() => setMenuOpen(false)}>{logoUrl ? <span className="wordmark-image" role="img" aria-label="شعار VELORA" style={{ backgroundImage: "url('" + logoUrl + "')" }} /> : <span>VELORA</span>}<small>BEAUTY · STYLE · YOU</small></Link><button className="icon-button" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)}><X /></button></div>
          <form className="header-search drawer-search" onSubmit={submitSearch}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحثي عن منتج..." /><button type="submit">بحث</button></form>
          {links.map(([label, href]) => <Link onClick={() => setMenuOpen(false)} href={href} key={href}>{label}</Link>)}
          <Link onClick={() => setMenuOpen(false)} href="/account/orders">طلباتي</Link>
        </nav>
      </div>}
    </>
  );
}
