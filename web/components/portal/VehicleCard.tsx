"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import type { PortalService, PortalVehicle } from "@/types/portal";

const STATUS_LABELS: Record<string, string> = {
  sent: "Enviado",
  approved: "Aprobado",
  completed: "Completado",
  rejected: "Rechazado",
};

function ServiceRow({ item }: { item: PortalService }) {
  const [open, setOpen] = useState(false);
  const { service, details } = item;

  return (
    <li className="rounded-md bg-surface-2 text-sm sm:bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-2 text-left text-muted hover:text-light"
      >
        <span>{service.date} — {service.serviceType} ({service.mileage} km)</span>
        {details.length > 0 && <span className="shrink-0 text-xs">{open ? "▲" : "▼"}</span>}
      </button>
      {open && (
        <div className="space-y-1 border-t border-border px-3 py-2">
          {service.notes && <p className="text-xs text-muted">{service.notes}</p>}
          {details.length === 0
            ? <p className="text-xs text-muted">Sin detalle cargado para este service.</p>
            : <ul className="space-y-0.5">
                {details.map((d) => (
                  <li key={d.detailId} className="flex items-center gap-2 text-xs">
                    <span className={d.done ? "text-success" : "text-muted"}>{d.done ? "✓" : "○"}</span>
                    <span className={d.done ? "text-light" : "text-muted"}>{d.description}</span>
                  </li>
                ))}
              </ul>}
        </div>
      )}
    </li>
  );
}

export function VehicleCard({ vehicle, budgets, services, workOrder }: PortalVehicle) {
  const [inquiry, setInquiry] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [asked, setAsked] = useState(false);

  async function askStatus() {
    setSending(true);
    setInquiry(null);
    try {
      const res = await fetch(`/api/portal/vehicles/${vehicle.vehicleId}/status-inquiry`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setInquiry({ type: "error", text: json.error?.message ?? "No se pudo enviar la consulta." });
        return;
      }
      setAsked(true);
      setInquiry({ type: "ok", text: "Listo, avisamos al taller. Te van a responder a la brevedad." });
    } catch {
      setInquiry({ type: "error", text: "No pudimos conectar. Probá de nuevo más tarde." });
    } finally {
      setSending(false);
    }
  }

  const hasMovements = budgets.length > 0 || services.length > 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:bg-surface-2 sm:p-6">
      {/* El botón principal va arriba, al lado del nombre — antes quedaba
          hasta abajo de todo el historial, y en un auto con mucho
          movimiento había que bajar bastante para encontrarlo. */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-lg font-semibold text-light">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-sm text-muted">
            {vehicle.plate}
            {vehicle.year ? ` · ${vehicle.year}` : ""} · {vehicle.currentMileage} km
          </p>
          {workOrder && <div className="mt-2"><Badge status={workOrder.status} /></div>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button variant="secondary" loading={sending} disabled={sending || asked} onClick={askStatus}>
            {asked ? "Consulta enviada" : "¿Cómo va mi auto?"}
          </Button>
          {inquiry && <Alert type={inquiry.type}>{inquiry.text}</Alert>}
        </div>
      </div>

      {!hasMovements && (
        <p className="pt-4 text-sm text-muted">Todavía no hay movimientos para este vehículo.</p>
      )}

      {hasMovements && (
        // Lado a lado en desktop (hay ancho de sobra con un solo auto
        // mostrado a la vez) — apilado en mobile, igual que antes.
        <div className="grid gap-6 pt-4 lg:grid-cols-2">
          {budgets.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-light">Presupuestos</p>
              <div className="space-y-2">
                {budgets.map(({ budget, details, total }) => (
                  <div key={budget.budgetId} className="rounded-md bg-surface-2 p-3 text-sm sm:bg-surface">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="text-light">{budget.number}</span>
                      <span className="text-accent">{STATUS_LABELS[budget.status] ?? budget.status}</span>
                    </div>
                    <ul className="mt-1 space-y-0.5 text-muted">
                      {details.map((d, i) => (
                        <li key={i} className="wrap-break-word">
                          {d.description} — ${d.subtotal.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 font-medium text-light">Total: ${total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-light">Historial de service</p>
              <p className="mb-1 text-xs text-muted">Tocá un service para ver el detalle.</p>
              <ul className="space-y-1">
                {services.map((item) => (
                  <ServiceRow key={item.service.serviceId} item={item} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
