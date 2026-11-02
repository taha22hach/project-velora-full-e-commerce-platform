"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Newsletter() {
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      const list = JSON.parse(localStorage.getItem("velora-newsletter") || "[]") as string[];
      localStorage.setItem("velora-newsletter", JSON.stringify([...new Set([...list, email])]));
      setDone(true);
      setBusy(false);
      return;
    }
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const result = await response.json();
    if (response.ok) setDone(true);
    else setMessage(result.error || "تعذر الاشتراك.");
    setBusy(false);
  }
  return <section className="newsletter-section">
    <div><span className="eyebrow">رسائل من عالم الجمال</span><h2>لحظات VELORA الجميلة، إلى بريدك</h2><p>كوني أول من يعرف عن القطع الجديدة والعروض المختارة.</p></div>
    {done ? <div className="newsletter-success"><Check size={18} /> تم تسجيلك بنجاح، أهلاً بكِ!</div> : <div className="newsletter-form-wrap"><form onSubmit={submit}><input name="email" type="email" required maxLength={254} placeholder="بريدك الإلكتروني" aria-label="البريد الإلكتروني" /><button aria-label="اشتراك" disabled={busy}><ArrowLeft size={19} /></button></form>{message && <small className="newsletter-error" role="status">{message}</small>}</div>}
  </section>;
}
