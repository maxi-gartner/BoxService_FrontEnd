"use client";

import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { useBudgets } from "@/hooks/useBudgets";
import { ApiClientError } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Vehicle } from "@/types/entities";

export function InvoicingList({ vehicle }: { vehicle: Vehicle }) {
  const { data: services, isLoading } = useServices();
  const { data: invoices } = useInvoices();
  const { data: budgets } = useBudgets();
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const mine = (services ?? [])
    .filter((s) => s.vehicleId === vehicle.vehicleId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function handleInvoice(serviceId: number) {
    setWorkingId(serviceId);
    try {
      const budget = budgets?.find((b) => b.serviceId === serviceId);
      const invoice = await createInvoice.mutateAsync({ serviceId, budgetId: budget?.budgetId ?? null });
      if (!budget) {
        setMessage({
          type: "error",
          text: "Factura emitida por $0 — este service no viene de un presupuesto, hoy no hay forma de cargarle un monto.",
        });
      } else {
        setMessage({ type: "ok", text: `Factura ${invoice.number} emitida por ${formatMoney(invoice.total)}.` });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo emitir la factura." });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleStatus(invoiceId: number, status: "paid" | "cancelled") {
    if (status === "cancelled" && !confirm("¿Seguro que querés anular esta factura?")) return;
    setWorkingId(invoiceId);
    try {
      await updateStatus.mutateAsync({ id: invoiceId, status });
      setMessage({ type: "ok", text: status === "paid" ? "Factura marcada como cobrada." : "Factura anulada." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo actualizar." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div>
      {message && <Alert type={message.type}>{message.text}</Alert>}

      <TableWrapper>
        <THead>
          <th>Service</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
          <th></th>
        </THead>
        <TBody>
          {isLoading && <EmptyRow colSpan={5}>Cargando facturación...</EmptyRow>}
          {!isLoading && mine.length === 0 && <EmptyRow colSpan={5}>Este vehículo todavía no tiene services cargados.</EmptyRow>}
          {mine.map((service) => {
            const invoice = invoices?.find((i) => i.serviceId === service.serviceId);
            const busy = workingId === (invoice?.invoiceId ?? service.serviceId);

            return (
              <TR key={service.serviceId} data-invoice-service-id={service.serviceId}>
                <TD>{service.serviceType}</TD>
                <TD className="text-muted">{formatDate(service.date)}</TD>
                <TD className="font-bold">{invoice ? formatMoney(invoice.total) : "—"}</TD>
                <TD>{invoice ? <Badge status={invoice.status} /> : <Badge status="draft" />}</TD>
                <TD className="flex gap-2">
                  {!invoice && (
                    <Button size="sm" disabled={busy} onClick={() => handleInvoice(service.serviceId)}>
                      Facturar
                    </Button>
                  )}
                  {invoice?.status === "issued" && (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => handleStatus(invoice.invoiceId, "paid")}>
                        Cobrar
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleStatus(invoice.invoiceId, "cancelled")}>
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
    </div>
  );
}
