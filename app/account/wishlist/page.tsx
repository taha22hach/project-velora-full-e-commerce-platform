import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { getProducts } from "@/lib/catalog";
import { WishlistProducts } from "@/components/wishlist-products";
export default async function WishlistPage() {
  const { user } = await getUserProfile();
  if (!user) redirect("/login?next=/account/wishlist");
  const products = await getProducts();
  return <main className="page-wrap account-page"><span className="eyebrow">احتفظي باختياراتك</span><h1>قائمة أمنياتي</h1><WishlistProducts products={products} /></main>;
}
