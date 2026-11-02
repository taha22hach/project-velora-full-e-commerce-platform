import Link from "next/link";
import { BadgeCheck, BarChart3, Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Settings2, TicketPercent, Users, WalletCards } from "lucide-react";

const items = [
  ["/admin", "نظرة عامة", LayoutDashboard],
  ["/admin/products", "المنتجات", Package],
  ["/admin/orders", "الطلبات", ClipboardList],
  ["/admin/wholesale", "طلبات الجملة", WalletCards],
  ["/admin/wholesale/orders", "طلبات التجار", ClipboardList],
  ["/admin/inventory", "المخزون", Boxes],
  ["/admin/categories", "التصنيفات", BarChart3],
  ["/admin/customers", "العملاء", Users],
  ["/admin/coupons", "كوبونات الخصم", TicketPercent],
  ["/admin/reviews", "التقييمات", BadgeCheck],
  ["/admin/settings", "إعدادات المتجر", Settings2],
] as const;

export function AdminNav() {
  return <aside className="admin-sidebar"><Link href="/admin" className="wordmark admin-wordmark"><span>VELORA</span><small>STORE ADMIN</small></Link><div className="admin-nav-label">إدارة المتجر</div><nav>{items.map(([href, label, Icon]) => <Link href={href} key={href}><Icon size={17} /><span>{label}</span></Link>)}</nav><div className="admin-sidebar-bottom"><span className="admin-user-dot">V</span><span><b>إدارة VELORA</b><small>مدير المتجر</small></span><form action="/api/auth/signout" method="post"><button aria-label="تسجيل الخروج"><LogOut size={16} /></button></form></div></aside>;
}
