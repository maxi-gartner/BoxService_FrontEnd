import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-muted mb-6">Hola, {user?.name} 👋</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Servidor</p>
          <p className="text-success font-semibold">healthy</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Modo backend</p>
          <p className="text-accent font-semibold">
            {process.env.BACKEND_MODE === "real" ? "real" : "mock"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Rol</p>
          <p className="font-semibold">{user?.role}</p>
        </Card>
      </div>
    </div>
  );
}
