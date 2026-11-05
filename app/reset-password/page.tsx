"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("كلمة المرور يجب ألا تقل عن 8 أحرف.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();

      if (!supabase) {
        setMessage("خدمة الحسابات غير متاحة حالياً.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(`خطأ من Supabase: ${error.message}`);
      } else {
        setMessage("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.");
      }
    } catch {
      setMessage("حدث خطأ غير متوقع. حاولي مرة أخرى.");
    } finally {
      setBusy(false);
    }
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
        <span className="eyebrow">تأمين الحساب</span>
        <h1>كلمة مرور جديدة</h1>
        <p>أدخلي كلمة المرور الجديدة وأكديها لاستعادة حسابك.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            كلمة المرور الجديدة
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 أحرف على الأقل"
              minLength={8}
              required
            />
          </label>

          <label>
            تأكيد كلمة المرور
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعيدي كتابة كلمة المرور"
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
            {busy ? "جارٍ الحفظ..." : "تغيير كلمة المرور"}
          </button>

          <p className="auth-switch">
            <Link href="/login">العودة إلى تسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
