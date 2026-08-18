import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user.name} role={user.role} />
      <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
