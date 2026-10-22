"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { ROLE_LABELS, type Role } from "@/types/auth";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string; roles?: Role[] };

// Operativo: pantallas de UN taller puntual (dueño/empleado). Superadmin
// no opera un taller, administra talleres — no tiene sentido acá.
const STAFF_NAV_ITEMS: NavItem[] = [
  { href: "/taller", label: "Taller", icon: "🔧" },
  { href: "/clientes", label: "Clientes", icon: "👤" },
  { href: "/vehiculos", label: "Vehículos", icon: "🚗" },
  { href: "/presupuestos", label: "Presupuestos", icon: "📋" },
  { href: "/facturas", label: "Facturas", icon: "🧾" },
  { href: "/catalogo", label: "Catálogo", icon: "💲" },
  // Datos del negocio (ingresos, etc.) — solo dueño, mismo criterio que
  // Administración.
  { href: "/metricas", label: "Métricas", icon: "📊", roles: ["owner"] },
  // Gestión de empleados/sucursales del propio tenant — solo dueño.
  { href: "/admin", label: "Administración", icon: "⚙️", roles: ["owner"] },
];

// Superadmin: administra talleres (tenants) y a toda la gente registrada
// en ellos, nunca datos operativos de un taller puntual — ver proxy.ts.
const SUPERADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/tenants", label: "Talleres", icon: "🏢" },
  { href: "/admin/usuarios", label: "Usuarios", icon: "👥" },
  { href: "/admin/pagos", label: "Pagos", icon: "💰" },
];

type Props = {
  userName: string;
  role: Role;
  /** null para superadmin (no pertenece a un tenant). */
  tenantName: string | null;
  /** Mobile: si el drawer está abierto. En desktop (md+) se ignora, siempre visible. */
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ userName, role, tenantName, isOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const items =
    role === "superadmin"
      ? SUPERADMIN_NAV_ITEMS
      : STAFF_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside
      className={cn(
        // Mobile: drawer fijo que entra/sale con un translate. Desktop
        // (md+): vuelve a ser parte normal del flujo, siempre visible —
        // el isOpen/translate deja de aplicar.
        "fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out",
        "md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <span className="text-accent text-xl">⚙</span>
        <span className="font-bold text-accent">BoxService</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-accent-dim text-accent" : "text-light hover:bg-white/5",
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p className="text-xs text-muted mb-1 truncate">{userName}</p>
        <p className="text-xs text-accent mb-2">{ROLE_LABELS[role]}</p>
        {tenantName && <p className="text-xs text-muted mb-2 truncate">{tenantName}</p>}
        <button onClick={handleLogout} className="text-xs text-danger hover:underline">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
