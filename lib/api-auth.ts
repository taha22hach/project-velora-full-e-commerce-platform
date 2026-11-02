import { createClient } from "@/lib/supabase/server";

export async function getApiActor() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, profile: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("id,role,is_active").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}
