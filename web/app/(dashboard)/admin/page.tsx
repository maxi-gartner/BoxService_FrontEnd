import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function AdminPage() {
  return (
    <ModulePlaceholder
      icon="⚙️"
      title="Administración"
      description="Alta de talleres y gestión de empleados (solo superadmin). Depende de la arquitectura multi-tenant y el auth con roles, todavía en desarrollo."
    />
  );
}
