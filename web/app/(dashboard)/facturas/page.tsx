"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useInvoices, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { useServices } from "@/hooks/useServices";
import { useVehicles } from "@/hooks/useVehicles";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/entities";

export default function FacturasPage() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: services } = useServices();
  const { data: vehicles } = useVehicles();
  const updateStatus = useUpdateInvoiceStatus();

  const vehicleByService = useMemo(() => {
    const vById = new Map((vehicles ?? []).map((v) => [v.vehicleId, v]));
    const map = new Map<number, ReturnType<typeof vById.get>>();
    for (const s of services ?? []) map.set(s.serviceId, vById.get(s.vehicleId));
    return map;
  }, [services, vehicles]);

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"todas" | "por-cobrar">("por-cobrar");

  async function act(id: number, status: InvoiceStatus, label: string) {
    if (status === "cancelled" && !confirm("¿Anular esta factura?")) return;
    setWorkingId(id);
    setMessage(null);
    try {
      await updateStatus.mutateAsync({ id, status });
      setMessage({ type: "ok", text: `${label} correctamente.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  const rows = (invoices ?? [])
    .filter((i) => (filter === "todas" ? true : i.status === "issued"))
    .sort((a, b) => b.invoiceId - a.invoiceId);

  const totalPorCobrar = (invoices ?? [])
    .filter((i) => i.status === "issued")
    .reduce((acc, i) => acc + i.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Facturas</h1>
      <p className="text-sm text-muted mb-6">
        Cobrá o anulá facturas emitidas. Para emitir una nueva, generá el service de un presupuesto aprobado en el Taller.
      </p>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Por cobrar</p>
          <p className="text-2xl font-bold text-accent">{formatMoney(totalPorCobrar)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Facturas emitidas</p>
          <p className="text-2xl font-bold">{(invoices ?? []).filter((i) => i.status === "issued").length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Total facturas</p>
          <p className="text-2xl font-bold">{invoices?.length ?? 0}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Listado</CardTitle>
          <div className="flex gap-1 text-xs">
            {(["por-cobrar", "todas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  filter === f
                    ? "rounded-full bg-accent-dim px-3 py-1 text-accent"
                    : "rounded-full px-3 py-1 text-muted hover:text-light"
                }
              >
                {f === "por-cobrar" ? "Por cobrar" : "Todas"}
              </button>
            ))}
          </div>
        </div>

        <TableWrapper>
          <THead>
            <th>Número</th>
            <th>Fecha</th>
            <th>Vehículo</th>
            <th>Total</th>
            <th>Estado</th>
            <th></th>
          </THead>
          <TBody>
            {isLoading && <EmptyRow colSpan={6}>Cargando...</EmptyRow>}
            {!isLoading && rows.length === 0 && (
              <EmptyRow colSpan={6}>
                {filter === "por-cobrar" ? "No hay facturas por cobrar." : "No hay facturas."}
              </EmptyRow>
            )}
            {rows.map((i) => {
              const vehicle = vehicleByService.get(i.serviceId);
              const label = vehicle ? `${vehicle.plate} — ${vehicle.brand} ${vehicle.model}` : `Service #${i.serviceId}`;
              const busy = workingId === i.invoiceId;

              return (
                <TR key={i.invoiceId}>
                  <TD className="text-accent">{i.number}</TD>
                  <TD className="text-muted">{formatDate(i.date)}</TD>
                  <TD>
                    {vehicle ? (
                      <Link href={`/taller?id=${vehicle.vehicleId}`} className="hover:text-accent hover:underline">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </TD>
                  <TD>{formatMoney(i.total)}</TD>
                  <TD>
                    <Badge status={i.status} />
                  </TD>
                  <TD className="flex flex-wrap gap-2">
                    {i.status === "issued" && (
                      <>
                        <Button size="sm" disabled={busy} onClick={() => act(i.invoiceId, "paid", "Cobrada")}>
                          Cobrar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => act(i.invoiceId, "cancelled", "Anulada")}
                        >
                          Anular
                        </Button>
                      </>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </TableWrapper>
      </Card>
    </div>
  );
}
