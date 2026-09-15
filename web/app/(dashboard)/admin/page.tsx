import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { redirect } from "next/navigation";
import { getSession, hasRole } from "@/lib/auth/session";

export default async function AdminPage() {
  const session = await getSession();
  if (!hasRole(session, "owner", "superadmin")) redirect("/dashboard");

  return (
    <ModulePlaceholder
      icon="⚙️"
      title="Administración"
      description="Gestión del taller y empleados para dueños. Alta de talleres y operación multi-tenant para superadmins."
    />
  );
}
