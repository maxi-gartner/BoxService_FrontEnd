"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { budgetsApi } from "@/lib/api/budgets";
import { vehiclesApi } from "@/lib/api/vehicles";
import { clientsApi } from "@/lib/api/clients";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatMoney } from "@/lib/utils";

function PresupuestoContent() {
  const budgetId = Number(useSearchParams().get("id"));

  const { data, isLoading } = useQuery({
    queryKey: ["budgets", budgetId],
    queryFn: () => budgetsApi.getById(budgetId),
    enabled: !!budgetId,
  });
  const { data: vehicle } = useQuery({
    queryKey: ["vehicles", data?.budget.vehicleId],
    queryFn: () => vehiclesApi.getById(data!.budget.vehicleId),
    enabled: !!data,
  });
  const { data: client } = useQuery({
    queryKey: ["clients", vehicle?.clientId],
    queryFn: () => clientsApi.getById(vehicle!.clientId),
    enabled: !!vehicle,
  });

  if (isLoading || !data || !vehicle || !client) {
    return <p className="text-muted text-center mt-20">Cargando...</p>;
  }

  const { budget, details, total } = data;

  return (
    <div className="min-h-screen flex justify-center py-10 px-4 bg-bg">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button variant="secondary" size="sm" onClick={() => window.close()}>
            Cerrar
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </Button>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 text-sm">
          <div className="flex items-start justify-between pb-6 mb-6 border-b border-dashed border-border">
            <div>
              <p className="text-2xl font-bold text-accent">⚙ BoxService</p>
              <p className="text-xs text-muted mt-1">Taller mecánico</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-light">Presupuesto</p>
              <p className="text-accent font-semibold">{budget.number}</p>
              <div className="mt-1 flex justify-end">
                <Badge status={budget.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-1">Cliente</p>
              <p className="text-light font-medium">{client.name}</p>
              {client.phone && <p className="text-muted">{client.phone}</p>}
              {client.email && <p className="text-muted">{client.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted mb-1">Vehículo</p>
              <p className="text-light font-medium">
                {vehicle.brand} {vehicle.model}
              </p>
              <p className="text-muted">{vehicle.plate}</p>
              <p className="text-muted">Fecha: {formatDate(budget.date)}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="text-left py-2 font-medium">Descripción</th>
                <th className="text-center py-2 font-medium w-20">Cant.</th>
                <th className="text-right py-2 font-medium w-28">Precio unit.</th>
                <th className="text-right py-2 font-medium w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted">
                    Sin ítems cargados.
                  </td>
                </tr>
              )}
              {details.map((d) => (
                <tr key={d.detailId} className="border-b border-border-light">
                  <td className="py-2 text-light">{d.description}</td>
                  <td className="py-2 text-center text-muted">{d.quantity}</td>
                  <td className="py-2 text-right text-muted">{formatMoney(d.unitPrice)}</td>
                  <td className="py-2 text-right text-light">{formatMoney(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="w-48 flex justify-between border-t border-border pt-3">
              <span className="font-bold text-light">Total</span>
              <span className="font-bold text-accent">{formatMoney(total)}</span>
            </div>
          </div>

          {budget.notes && (
            <div className="mb-6 pt-4 border-t border-dashed border-border">
              <p className="text-xs uppercase tracking-wide text-muted mb-1">Notas</p>
              <p className="text-light">{budget.notes}</p>
            </div>
          )}

          <p className="pt-4 border-t border-dashed border-border text-center text-xs text-muted">
            Presupuesto {budget.number} — generado desde BoxService. Documento no válido como factura.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PresupuestoPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center mt-20">Cargando...</p>}>
      <PresupuestoContent />
    </Suspense>
  );
}
