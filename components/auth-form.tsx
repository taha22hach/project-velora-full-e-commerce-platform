"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.email("أدخل بريداً إلكترونياً صحيحاً"),
  password: z.string().min(8, "كلمة المرور ٨ أحرف على الأقل"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function AuthForm({ initialMessage = "" }: { initialMessage?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema) as unknown as Resolver<LoginValues>,
    defaultValues: { email: "", password: "" },
  });
  const { register, handleSubmit, formState: { errors } } = form;

  async function onSubmit(values: LoginValues) {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("أضيفي إعدادات Supabase في ملف .env.local ثم أعيدي تشغيل التطبيق.");
      setBusy(false);
      return;
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setMessage("تعذر تسجيل الدخول. تحققي من البريد وكلمة المرور.");
    } else {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setMessage("تعذر التحقق من صلاحيات الحساب. تواصلي مع الإدارة.");
      } else if (profile.is_active === false) {
        await supabase.auth.signOut();
        setMessage("هذا الحساب غير نشط. تواصلي مع الإدارة.");
      } else {
        const candidate = new URLSearchParams(window.location.search).get("next");
        const nextPath = candidate?.startsWith("/") && !candidate.startsWith("//")
          ? candidate
          : profile.role === "admin" ? "/admin" : "/account";
        router.push(nextPath);
      }
    }
    setBusy(false);
  }

  return <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
    <label>البريد الإلكتروني<input autoComplete="email" type="email" {...register("email")} placeholder="name@example.com" dir="ltr" />{errors.email && <small>{errors.email.message}</small>}</label>
    <label>كلمة المرور<input autoComplete="current-password" type="password" {...register("password")} placeholder="٨ أحرف على الأقل" dir="ltr" />{errors.password && <small>{errors.password.message}</small>}</label>
    <p className="auth-switch"><Link href="/forgot-password">نسيت كلمة المرور؟</Link></p>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="button button-primary button-wide" disabled={busy}>{busy ? "جارٍ الدخول..." : "تسجيل الدخول"}</button>
    <p className="auth-switch">يمكنك الشراء كزائر دون إنشاء حساب. <Link href="/shop">تصفحي المتجر</Link></p>
  </form>;
}
