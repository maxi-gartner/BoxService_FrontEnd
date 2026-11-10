import { redirect } from "next/navigation";
import { getSession, hasRole } from "@/lib/auth/session";
import { CatalogPanel } from "@/components/catalog/CatalogPanel";

export default async function CatalogoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasRole(session, "owner", "employee")) redirect("/admin/tenants");
  return <CatalogPanel canManage={hasRole(session, "owner")} />;
}
