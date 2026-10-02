"use client";

import { useState } from "react";
import { useBudgets, useUpdateBudgetStatus, useAssignServiceToBudget } from "@/hooks/useBudgets";
import { useInvoices, useCreateInvoice } from "@/hooks/useInvoices";
import { useCreateService, useCreateServiceDetail } from "@/hooks/useServices";
import { budgetsApi } from "@/lib/api/budgets";
import { ApiClientError } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import type { Budget, BudgetStatus, Vehicle } from "@/types/entities";

function isCompleted(b: Budget) {
  return b.status === "completed" || (b.status === "approved" && !!b.serviceId);
}

export function BudgetsList({ vehicle, onChanged }: { vehicle: Vehicle; onChanged: () => void }) {
  const { data: budgets, isLoading } = useBudgets();
  const { data: invoices } = useInvoices();
  const updateStatus = useUpdateBudgetStatus();
  const assignService = useAssignServiceToBudget();
  const createInvoice = useCreateInvoice();
  const createService = useCreateService();
  const createServiceDetail = useCreateServiceDetail();

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const mine = (budgets ?? []).filter((b) => b.vehicleId === vehicle.vehicleId);

  async function handleApprove(id: number) {
    setWorkingId(id);
    try {
      const res = await updateStatus.mutateAsync({ id, status: "approved" as BudgetStatus });
      setMessage({ type: "ok", text: res.message ?? "Presupuesto aprobado." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo aprobar." });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleReject(id: number, isCancel: boolean) {
    if (isCancel && !confirm("¿Cancelar este trabajo? El presupuesto queda como rechazado.")) return;
    setWorkingId(id);
    try {
      await updateStatus.mutateAsync({ id, status: "rejected" });
      setMessage({ type: "ok", text: isCancel ? "Trabajo cancelado." : "Presupuesto rechazado." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleGenerateService(budget: Budget) {
    setWorkingId(budget.budgetId);
    try {
      let mileage = vehicle.currentMileage;
      if (!mileage || mileage <= 0) {
        const entered = window.prompt(`Ingresá el kilometraje actual para generar el service del presupuesto ${budget.number}:`);
        if (!entered) throw new Error("Se canceló la creación del service.");
        mileage = Number(entered);
        if (!mileage || mileage <= 0) throw new Error("El kilometraje debe ser mayor a 0.");
      }

      const detail = await budgetsApi.getById(budget.budgetId);
      const descriptions = detail.details.map((d) => d.description).filter((d) => d.length > 0);
      if (!descriptions.length) throw new Error("El presupuesto no tiene detalles para cargar en el service.");

      const service = await createService.mutateAsync({
        vehicleId: budget.vehicleId,
        date: new Date().toISOString().slice(0, 10),
        mileage,
        serviceType: "Service desde presupuesto",
        notes: `Generado desde presupuesto ${budget.number}.`,
      });

      for (const description of descriptions) {
        await createServiceDetail.mutateAsync({ serviceId: service.serviceId, data: { description, done: true } });
      }

      await assignService.mutateAsync({ budgetId: budget.budgetId, serviceId: service.serviceId });

      setMessage({ type: "ok", text: "Service creado correctamente desde el presupuesto aprobado." });
      onChanged();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "No se pudo generar el service." });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleInvoice(budget: Budget) {
    if (!budget.serviceId) return;
    setWorkingId(budget.budgetId);
    try {
      const invoice = await createInvoice.mutateAsync({ serviceId: budget.serviceId, budgetId: budget.budgetId });
      setMessage({ type: "ok", text: `Factura ${invoice.number} emitida.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo facturar." });
    } finally {
      setWorkingId(null);
    }
  }

  function handleViewInvoice(serviceId: number) {
    const row = document.querySelector(`[data-invoice-service-id="${serviceId}"]`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    row?.classList.add("bg-accent-dim");
    setTimeout(() => row?.classList.remove("bg-accent-dim"), 2000);
  }

  return (
    <div>
      {message && <Alert type={message.type}>{message.text}</Alert>}

      <TableWrapper>
        <THead>
          <th>Número</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th></th>
        </THead>
        <TBody>
          {isLoading && <EmptyRow colSpan={4}>Cargando presupuestos...</EmptyRow>}
          {!isLoading && mine.length === 0 && <EmptyRow colSpan={4}>Este vehículo todavía no tiene presupuestos.</EmptyRow>}
          {mine.map((b) => {
            const completed = isCompleted(b);
            const invoice = completed && b.serviceId ? invoices?.find((i) => i.serviceId === b.serviceId) : null;
            const busy = workingId === b.budgetId;

            return (
              <TR key={b.budgetId}>
                <TD className="text-accent">{b.number}</TD>
                <TD className="text-muted">{formatDate(b.date)}</TD>
                <TD>
                  <Badge status={completed ? "completed" : b.status} />
                </TD>
                <TD className="flex gap-2">
                  {(b.status === "draft" || b.status === "sent") && (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => handleApprove(b.budgetId)}>
                        Aprobar
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleReject(b.budgetId, false)}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {b.status === "approved" && !completed && (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => handleGenerateService(b)}>
                        Trabajo realizado
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleReject(b.budgetId, true)}>
                        Cancelar
                      </Button>
                    </>
                  )}
                  {completed && b.serviceId && (
                    <>
                      {invoice ? (
                        <Button size="sm" variant="secondary" onClick={() => handleViewInvoice(b.serviceId!)}>
                          Ver factura
                        </Button>
                      ) : (
                        <Button size="sm" disabled={busy} onClick={() => handleInvoice(b)}>
                          Facturar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(`/ticket?serviceId=${b.serviceId}`, "_blank")}
                      >
                        Generar ticket
                      </Button>
                    </>
                  )}
                  {b.status === "rejected" && "—"}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </TableWrapper>
    </div>
  );
}
