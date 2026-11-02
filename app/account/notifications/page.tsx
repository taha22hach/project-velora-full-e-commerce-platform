import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserProfile } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications-list";
export default async function NotificationsPage() {
  const { user, supabase } = await getUserProfile();
  if (!user) redirect("/login?next=/account/notifications");
  const { data } = await supabase!.from("notifications").select("id,title,body,kind,href,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  return <main className="page-wrap account-page"><Link className="breadcrumb" href="/account"><ArrowLeft size={14} /> حسابي</Link><span className="eyebrow">تحديثات VELORA</span><h1>الإشعارات</h1><NotificationsList notifications={data || []} /></main>;
}
