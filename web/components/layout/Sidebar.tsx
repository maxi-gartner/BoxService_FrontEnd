"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import type { Role } from "@/types/auth";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string; roles?: Role[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/clientes", label: "Clientes", icon: "👤" },
  { href: "/vehiculos", label: "Vehículos", icon: "🚗" },
  { href: "/taller", label: "Taller", icon: "🔧" },
  { href: "/presupuestos", label: "Presupuestos", icon: "📋" },
  { href: "/facturas", label: "Facturas", icon: "🧾" },
  { href: "/catalogo", label: "Catálogo", icon: "💲" },
  { href: "/admin", label: "Administración", icon: "⚙️", roles: ["superadmin"] },
];

export function Sidebar({ userName, role }: { userName: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <span className="text-accent text-xl">⚙</span>
        <span className="font-bold text-accent">BoxService</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <p className="text-xs text-muted mb-2">{userName}</p>
        <button onClick={handleLogout} className="text-xs text-danger hover:underline">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
