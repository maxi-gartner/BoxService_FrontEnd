"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { Role } from "@/types/auth";

export function DashboardShell({
  userName,
  role,
  children,
}: {
  userName: string;
  role: Role;
  children: ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Backdrop: solo existe en mobile mientras el drawer está abierto */}
      {isSidebarOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <Sidebar
        userName={userName}
        role={role}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* min-w-0: sin esto un hijo de flex no se achica más allá del
          ancho de su contenido (tablas anchas, texto largo) y termina
          desbordando la página en vez de dejar que el scroll horizontal
          interno de cada tabla haga su trabajo. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="text-2xl leading-none text-light"
          >
            ☰
          </button>
          <span className="font-bold text-accent">⚙ BoxService</span>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
