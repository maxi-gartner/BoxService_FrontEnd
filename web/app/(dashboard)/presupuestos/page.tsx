"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useBudgets, useUpdateBudgetStatus, useBudget } from "@/hooks/useBudgets";
import { useVehicles } from "@/hooks/useVehicles";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Budget } from "@/types/entities";

function isCompleted(b: Budget) {
  return b.status === "completed" || (b.status === "approved" && !!b.serviceId);
}

function BudgetDetailRow({ budgetId, colSpan }: { budgetId: number; colSpan: number }) {
  const { data, isLoading } = useBudget(budgetId);
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-3 bg-surface-2">
        {isLoading && <p className="text-sm text-muted">Cargando detalle...</p>}
        {data && (
          <div className="space-y-2">
            {data.details.length === 0 && <p className="text-sm text-muted">Sin ítems.</p>}
            {data.details.map((d) => (
              <div key={d.detailId} className="flex justify-between text-sm">
                <span>
                  {d.description}{" "}
                  <span className="text-muted">
                    ({d.quantity} × {formatMoney(d.unitPrice)})
                  </span>
                </span>
                <span className="text-light">{formatMoney(d.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Total</span>
              <span className="text-accent">{formatMoney(data.total)}</span>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function PresupuestosPage() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: vehicles } = useVehicles();
  const updateStatus = useUpdateBudgetStatus();

  const vehiclesById = useMemo(
    () => new Map((vehicles ?? []).map((v) => [v.vehicleId, v])),
    [vehicles],
  );

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendientes">("todos");

  async function act(id: number, status: "approved" | "rejected") {
    setWorkingId(id);
    setMessage(null);
    try {
      await updateStatus.mutateAsync({ id, status });
      setMessage({ type: "ok", text: status === "approved" ? "Presupuesto aprobado." : "Presupuesto rechazado." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  const rows = (budgets ?? [])
    .filter((b) =>
      statusFilter === "todos" ? true : b.status === "draft" || b.status === "sent",
    )
    .sort((a, b) => b.budgetId - a.budgetId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Presupuestos</h1>
      <p className="text-sm text-muted mb-6">
        Aprobá o rechazá desde acá. Para crear uno nuevo o generar el service de uno aprobado, andá al Taller.
      </p>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Listado</CardTitle>
          <div className="flex gap-1 text-xs">
            {(["pendientes", "todos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={
                  statusFilter === f
                    ? "rounded-full bg-accent-dim px-3 py-1 text-accent"
                    : "rounded-full px-3 py-1 text-muted hover:text-light"
                }
              >
                {f === "pendientes" ? "Pendientes" : "Todos"}
              </button>
            ))}
          </div>
        </div>

        <TableWrapper>
          <THead>
            <th>Número</th>
            <th>Fecha</th>
            <th>Vehículo</th>
            <th>Estado</th>
            <th></th>
          </THead>
          <TBody>
            {isLoading && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
            {!isLoading && rows.length === 0 && (
              <EmptyRow colSpan={5}>
                {statusFilter === "pendientes" ? "No hay presupuestos pendientes." : "No hay presupuestos."}
              </EmptyRow>
            )}
            {rows.map((b) => {
              const vehicle = vehiclesById.get(b.vehicleId);
              const label = vehicle ? `${vehicle.plate} — ${vehicle.brand} ${vehicle.model}` : `Vehículo #${b.vehicleId}`;
              const completed = isCompleted(b);
              const busy = workingId === b.budgetId;
              const pending = b.status === "draft" || b.status === "sent";

              return (
                <Fragment key={b.budgetId}>
                  <TR>
                    <TD className="text-accent">{b.number}</TD>
                    <TD className="text-muted">{formatDate(b.date)}</TD>
                    <TD>
                      <Link href={`/taller?id=${b.vehicleId}`} className="hover:text-accent hover:underline">
                        {label}
                      </Link>
                    </TD>
                    <TD>
                      <Badge status={completed ? "completed" : b.status} />
                    </TD>
                    <TD className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setExpandedId(expandedId === b.budgetId ? null : b.budgetId)}
                      >
                        {expandedId === b.budgetId ? "Ocultar" : "Ver detalle"}
                      </Button>
                      {pending && (
                        <>
                          <Button size="sm" disabled={busy} onClick={() => act(b.budgetId, "approved")}>
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busy}
                            onClick={() => act(b.budgetId, "rejected")}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </TD>
                  </TR>
                  {expandedId === b.budgetId && <BudgetDetailRow budgetId={b.budgetId} colSpan={5} />}
                </Fragment>
              );
            })}
          </TBody>
        </TableWrapper>
      </Card>
    </div>
  );
}
