"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = createClient();

    if (!supabase) {
      setMessage("خدمة الحسابات غير متاحة حالياً. حاولي لاحقاً.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage("تعذر إرسال الرابط. تأكدي من البريد الإلكتروني وحاولي مرة أخرى.");
    } else {
      setMessage("تم إرسال رابط استعادة كلمة المرور. راجعي بريدك الإلكتروني.");
    }

    setBusy(false);
  }

  return (
    <section className="auth-page">
      <div className="auth-art">
        <div className="auth-art-copy">
          <span>VELORA</span>
          <p>اختاري نفسك<br />في كل يوم.</p>
        </div>
      </div>

      <div className="auth-panel">
        <span className="eyebrow">استعادة الحساب</span>
        <h1>نسيتِ كلمة المرور؟</h1>
        <p>أدخلي بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة كلمة المرور.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              required
            />
          </label>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          <button
            className="button button-primary button-wide"
            type="submit"
            disabled={busy}
          >
            {busy ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
          </button>

          <p className="auth-switch">
            <Link href="/login">العودة إلى تسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
