import Link from "next/link";
import { Camera, Globe2, Mail, Phone, MapPin, ArrowUp } from "lucide-react";

export function SiteFooter({ contact, social }: { contact?: { phone?: string; email?: string; city?: string } | null; social?: { instagram?: string; facebook?: string } | null }) {
  return <footer className="site-footer">
    <div className="page-wrap">
      <div className="footer-main">
        <div className="footer-brand"><Link className="wordmark footer-wordmark" href="/"><span>VELORA</span><small>BEAUTY · STYLE · YOU</small></Link><p>جمالك، أسلوبك، اختيارك. اكتشفي عالماً من الجمال والقطع المختارة بعناية.</p><div className="social-links">{social?.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="إنستغرام"><Camera size={17} /></a>}{social?.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="فيسبوك"><Globe2 size={17} /></a>}</div></div>
        <div><h3>تسوقي</h3><Link href="/shop">كل المنتجات</Link><Link href="/categories/skincare">العناية بالبشرة</Link><Link href="/categories/makeup">المكياج</Link><Link href="/categories/fashion">الأزياء</Link></div>
        <div><h3>عن VELORA</h3><Link href="/about">قصتنا</Link><Link href="/contact">تواصلي معنا</Link><Link href="/wholesale">برنامج الجملة</Link><Link href="/account/orders">تتبع الطلب</Link></div>
        <div className="footer-contact"><h3>يسعدنا تواصلك</h3><span><Phone size={15} /> {contact?.phone || "16688"}</span><span><Mail size={15} /> {contact?.email || "hello@velora.eg"}</span><span><MapPin size={15} /> {contact?.city || "القاهرة، مصر"}</span></div>
      </div>
      <div className="footer-bottom"><span>© ٢٠٢٦ VELORA. جميع الحقوق محفوظة.</span><span>صُنع بكل حب في مصر <b>♡</b></span><Link href="#" aria-label="العودة للأعلى"><ArrowUp size={16} /> للأعلى</Link></div>
    </div>
  </footer>;
}
