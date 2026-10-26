"use client";

import { useState } from "react";
import Link from "next/link";
import { useInvoiceStats, useInvoices, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { ApiClientError } from "@/lib/api/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/entities";

export default function FacturasPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"todas" | "por-cobrar">("por-cobrar");
  const { data: invoicesPage, isLoading } = useInvoices({ page, pageSize: 25, status: filter });
  const { data: stats } = useInvoiceStats();
  const updateStatus = useUpdateInvoiceStatus();

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  // Reset de página al cambiar el filtro — ajuste de estado durante el
  // render (patrón recomendado por React), no un efecto.
  const [filterForPage, setFilterForPage] = useState(filter);
  if (filter !== filterForPage) {
    setFilterForPage(filter);
    setPage(1);
  }

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

  const rows = invoicesPage?.items ?? [];

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
          <p className="text-2xl font-bold text-accent">{formatMoney(stats?.pendingTotal ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Facturas emitidas</p>
          <p className="text-2xl font-bold">{stats?.pendingCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted mb-1">Total facturas</p>
          <p className="text-2xl font-bold">{stats?.totalCount ?? 0}</p>
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
              const label = i.vehiclePlate
                ? `${i.vehiclePlate} — ${i.vehicleBrand} ${i.vehicleModel}`
                : `Service #${i.serviceId}`;
              const busy = workingId === i.invoiceId;

              return (
                <TR key={i.invoiceId}>
                  <TD className="text-accent">{i.number}</TD>
                  <TD className="text-muted">{formatDate(i.date)}</TD>
                  <TD>
                    {i.vehicleId ? (
                      <Link href={`/taller?id=${i.vehicleId}`} className="hover:text-accent hover:underline">
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
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(`/factura?id=${i.invoiceId}`, "_blank")}
                    >
                      Imprimir / PDF
                    </Button>
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
        {invoicesPage && (
          <Pagination
            page={invoicesPage.page}
            totalPages={invoicesPage.totalPages}
            totalCount={invoicesPage.totalCount}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}
