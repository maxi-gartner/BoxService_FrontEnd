import { redirect } from "next/navigation";
import { getSession, hasRole } from "@/lib/auth/session";
import { AdminOwnerPanel } from "@/components/admin/AdminOwnerPanel";

export default async function AdminPage() {
  const session = await getSession();
  if (!hasRole(session, "owner", "superadmin")) redirect("/taller");

  // Superadmin administra talleres, no tiene uno propio para gestionar
  // acá — su panel real es /admin/tenants (ver Sidebar.tsx).
  if (session!.role === "superadmin") redirect("/admin/tenants");

  return <AdminOwnerPanel />;
}
