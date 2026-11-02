import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VELORA | جمالك، أسلوبك، اختيارك", template: "%s | VELORA" },
  description: "تسوقي منتجات الجمال والعناية والأزياء والإكسسوارات المختارة بعناية من VELORA.",
  applicationName: "VELORA",
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#fbf8f6",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: branding } = supabase ? await supabase.rpc("public_store_branding") : { data: null };
  return <html lang="ar" dir="rtl">
    <body><CartProvider><SiteHeader logoUrl={branding?.logo_url || null} /><div className="site-main">{children}</div><SiteFooter contact={branding?.contact || null} social={branding?.social || null} /></CartProvider></body>
  </html>;
}
