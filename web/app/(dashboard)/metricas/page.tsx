import { redirect } from "next/navigation";
import { getSession, hasRole } from "@/lib/auth/session";
import { MetricsDashboard } from "@/components/metrics/MetricsDashboard";

export default async function MetricasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasRole(session, "owner")) redirect("/taller");
  return <MetricsDashboard />;
}
