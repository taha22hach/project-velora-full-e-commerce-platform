import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email().trim().max(254) });
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "صيغة الطلب غير صحيحة." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "أدخلي بريداً إلكترونياً صحيحاً." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  if (!rateLimit("newsletter:" + email, 3, 60 * 60 * 1000).allowed) return NextResponse.json({ error: "تم تسجيل هذا البريد مؤخراً. حاولي لاحقاً." }, { status: 429 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ success: true, demo: true });
  const { error } = await supabase.rpc("subscribe_newsletter", { p_email: email });
  if (error) return NextResponse.json({ error: "تعذر تسجيل البريد. حاولي مرة أخرى." }, { status: 400 });
  return NextResponse.json({ success: true });
}
