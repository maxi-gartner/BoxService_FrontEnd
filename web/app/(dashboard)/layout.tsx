import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell userName={user.name} role={user.role}>
      {children}
    </DashboardShell>
  );
}
