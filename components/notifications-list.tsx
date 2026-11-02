"use client";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
type Notification = { id: string; title: string; body: string; kind: string; href: string | null; read_at: string | null; created_at: string };
export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  async function markRead(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
  }
  if (!notifications.length) return <div className="empty-state"><Bell size={31} /><h2>لا توجد إشعارات</h2><p>ستظهر هنا تحديثات الطلبات والحساب.</p></div>;
  return <div className="notifications-list">{notifications.map((item) => <article className={"notification-card" + (item.read_at ? " is-read" : "")} key={item.id}><span className="notification-icon"><Bell size={16} /></span><div><h2>{item.title}</h2><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("ar-EG")}</small></div>{!item.read_at && <button className="table-small-action" onClick={() => markRead(item.id)}>تمت القراءة <Check size={12} /></button>}</article>)}</div>;
}
