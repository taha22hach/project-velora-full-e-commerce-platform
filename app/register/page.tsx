import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "إنشاء حساب" };
export default function RegisterPage() {
  return <section className="auth-page"><div className="auth-art register-art"><div className="auth-art-copy"><span>VELORA</span><p>مساحتكِ الخاصة<br />لجمال يشبهك.</p></div></div><div className="auth-panel"><span className="eyebrow">أهلاً بكِ في VELORA</span><h1>أنشئي حسابك</h1><p>تسوق أسرع، وتتبع أسهل، واختيارات محفوظة لكِ.</p><AuthForm mode="register" /></div></section>;
}
