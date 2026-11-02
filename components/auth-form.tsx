"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({ email: z.email("أدخلي بريداً إلكترونياً صحيحاً"), password: z.string().min(8, "كلمة المرور ٨ أحرف على الأقل") });
const registerSchema = loginSchema.extend({ fullName: z.string().min(2, "الاسم مطلوب"), phone: z.string().min(8, "أدخلي رقم هاتف صحيحاً") });
type AuthValues = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<AuthValues>({ resolver: zodResolver(schema) as unknown as Resolver<AuthValues>, defaultValues: { email: "", password: "", fullName: "", phone: "" } });
  const { register, handleSubmit, formState: { errors } } = form;

  async function onSubmit(values: AuthValues) {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("لإدارة الحسابات بأمان، أضيفي إعدادات Supabase في ملف .env.local ثم أعيدي تشغيل التطبيق.");
      setBusy(false);
      return;
    }
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) setMessage("تعذر تسجيل الدخول. تحققي من البريد وكلمة المرور.");
      else {
        const candidate = new URLSearchParams(window.location.search).get("next");
        const nextPath = candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/account";
        router.push(nextPath);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.fullName, phone: values.phone } },
      });
      if (error) setMessage(error.message);
      else setMessage("تم إنشاء حسابك. إذا كان تأكيد البريد مفعلاً، راجعي بريدك لإكمال التسجيل.");
    }
    setBusy(false);
  }

  return <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
    {mode === "register" && <><label>الاسم الكامل<input autoComplete="name" {...register("fullName")} placeholder="اسمك كما تحبين" />{errors.fullName && <small>{errors.fullName.message}</small>}</label><label>رقم الهاتف<input autoComplete="tel" {...register("phone")} placeholder="01XXXXXXXXX" dir="ltr" />{errors.phone && <small>{errors.phone.message}</small>}</label></>}
    <label>البريد الإلكتروني<input autoComplete="email" type="email" {...register("email")} placeholder="name@example.com" dir="ltr" />{errors.email && <small>{errors.email.message}</small>}</label>
    <label>كلمة المرور<input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" {...register("password")} placeholder="٨ أحرف على الأقل" dir="ltr" />{errors.password && <small>{errors.password.message}</small>}</label>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="button button-primary button-wide" disabled={busy}>{busy ? "جارٍ الإرسال..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حسابي"}</button>
    <p className="auth-switch">{mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}<Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "أنشئي حساباً" : "سجّلي الدخول"}</Link></p>
  </form>;
}
