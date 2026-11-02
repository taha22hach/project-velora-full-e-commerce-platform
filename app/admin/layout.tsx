import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return <div className="admin-shell"><AdminNav /><main className="admin-main">{children}</main></div>;
}
