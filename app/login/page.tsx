import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "تسجيل الدخول" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmation?: string }> }) {
  const params = await searchParams;
  const initialMessage = params.confirmation === "error"
    ? "تعذر تفعيل البريد الإلكتروني. اطلبي رابط تفعيل جديد وحاولي مرة أخرى."
    : "";
  return <section className="auth-page"><div className="auth-art"><div className="auth-art-copy"><span>VELORA</span><p>كل يوم يحمل فرصة<br />لأن تختاري نفسك.</p></div></div><div className="auth-panel"><span className="eyebrow">مرحباً بعودتك</span><h1>سجّلي الدخول</h1><p>ادخلي إلى حسابك لمتابعة طلباتك واختياراتك.</p><AuthForm mode="login" initialMessage={initialMessage} /></div></section>;
}
