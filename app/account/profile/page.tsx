import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
export default async function AccountProfilePage() {
  const { user, profile, supabase } = await getUserProfile();
  if (!user) redirect("/login?next=/account/profile");
  const { data: addresses } = await supabase!.from("addresses").select("id,recipient_name,phone,city,area,street,notes,is_default").eq("user_id", user.id).order("is_default",{ascending:false}).order("created_at",{ascending:false});
  return <main className="page-wrap account-page"><span className="eyebrow">مساحتك الخاصة</span><h1>بياناتي وعناويني</h1><p>حدّثي بيانات حسابك واحتفظي بعناوين التوصيل.</p><ProfileForm profile={{ id: user.id, email: user.email || "", full_name: profile?.full_name || "", phone: profile?.phone || "" }} addresses={addresses || []} /></main>;
}
