import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { REAL_BACKEND_RESOURCE_NAMES } from "@/lib/backend-mode";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // auth/users van siempre al mock — si todo lo demás ya es real, se
  // muestra "real" a secas; si es parcial, se listan los módulos activos.
  const totalResources = 6;
  const backendModeLabel =
    process.env.BACKEND_MODE !== "real"
      ? "mock"
      : REAL_BACKEND_RESOURCE_NAMES.length >= totalResources
        ? "real"
        : `real (${REAL_BACKEND_RESOURCE_NAMES.join(", ")})`;

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
          <p className="text-accent font-semibold">{backendModeLabel}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Rol</p>
          <p className="font-semibold">{user?.role}</p>
        </Card>
      </div>
    </div>
  );
}
