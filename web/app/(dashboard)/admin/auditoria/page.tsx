import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AuthAuditTable } from "@/components/admin/AuthAuditTable";

export default async function AuditPage() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/admin/tenants");
  return <AuthAuditTable />;
}
