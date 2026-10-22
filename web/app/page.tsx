import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // superadmin no tiene tenant propio — el dashboard genérico no le
  // sirve de nada, va directo a su panel de talleres.
  redirect(session.role === "superadmin" ? "/admin/tenants" : "/dashboard");
}
