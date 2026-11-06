"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({ email: z.email("أدخل بريداً إلكترونياً صحيحاً"), password: z.string().min(8, "كلمة المرور ٨ أحرف على الأقل") });
const registerSchema = loginSchema.extend({ fullName: z.string().min(2, "الاسم مطلوب"), phone: z.string().min(8, "أدخل رقم هاتف صحيحاً") });
type AuthValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode, initialMessage = "" }: { mode: "login" | "register"; initialMessage?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<AuthValues>({ resolver: zodResolver(schema) as unknown as Resolver<AuthValues>, defaultValues: { email: "", password: "", fullName: "", phone: "" } });
  const { register, handleSubmit, formState: { errors } } = form;

  async function onSubmit(values: AuthValues) {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("لإدارة الحسابات بأمان، أضيف إعدادات Supabase في ملف .env.local ثم أعيد تشغيل التطبيق.");
      setBusy(false);
      return;
    }
    if (mode === "login") {
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

    const nextPath =
      candidate?.startsWith("/") && !candidate.startsWith("//")
        ? candidate
        : profile.role === "admin"
          ? "/admin"
          : "/account";

    router.push(nextPath);
  }
}
    } else {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: values.fullName, phone: values.phone },
        },
      });
      if (error) setMessage(error.message);
      else setMessage("تم إنشاء حسابك. راجع بريدك واضغط رابط التفعيل لإكمال التسجيل.");
    }
    setBusy(false);
  }

  return <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
    {mode === "register" && <><label>الاسم الكامل<input autoComplete="name" {...register("fullName")} placeholder="اسمك كما تحبين" />{errors.fullName && <small>{errors.fullName.message}</small>}</label><label>رقم الهاتف<input autoComplete="tel" {...register("phone")} placeholder="01XXXXXXXXX" dir="ltr" />{errors.phone && <small>{errors.phone.message}</small>}</label></>}
    <label>البريد الإلكتروني<input autoComplete="email" type="email" {...register("email")} placeholder="name@example.com" dir="ltr" />{errors.email && <small>{errors.email.message}</small>}</label>
    <label>كلمة المرور<input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" {...register("password")} placeholder="٨ أحرف على الأقل" dir="ltr" />{errors.password && <small>{errors.password.message}</small>}</label>
    {mode === "login" && <p className="auth-switch"><Link href="/forgot-password">نسيت كلمة المرور؟</Link></p>}
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="button button-primary button-wide" disabled={busy}>{busy ? "جارٍ الإرسال..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حسابي"}</button>
    <p className="auth-switch">{mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}<Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "أنشئ حساباً" : "سجّلي الدخول"}</Link></p>
  </form>;
}
