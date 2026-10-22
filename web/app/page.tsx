import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // superadmin no tiene tenant propio — va directo a su panel de
  // talleres. dueño/empleado arrancan en Taller, no en un dashboard
  // genérico (sacado — no aportaba nada que no esté ya en Taller).
  redirect(session.role === "superadmin" ? "/admin/tenants" : "/taller");
}
