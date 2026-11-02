import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUserProfile() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, profile: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}

export async function requireAdmin() {
  const result = await getUserProfile();
  if (!result.user) redirect("/login?next=/admin");
  if (result.profile?.role !== "admin" || result.profile?.is_active === false) redirect("/");
  return result;
}

