"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Fragment, useState } from "react";
import { useServicesByVehicle } from "@/hooks/useServices";
import { useInvoicesByVehicle, useCreateInvoice, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { useBudgetsByVehicle } from "@/hooks/useBudgets";
import { DirectInvoiceForm } from "@/components/taller/DirectInvoiceForm";
import { ApiClientError } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { InvoiceDetailRequest, Vehicle } from "@/types/entities";

export function InvoicingList({ vehicle }: { vehicle: Vehicle }) {
  const { data: services, isLoading, error: servicesByVehicleLoadError, isLoading: servicesByVehicleLoading, refetch: refetchServicesByVehicle } = useServicesByVehicle(vehicle.vehicleId);
  const { data: invoices, error: invoicesByVehicleLoadError, isLoading: invoicesByVehicleLoading, refetch: refetchInvoicesByVehicle } = useInvoicesByVehicle(vehicle.vehicleId);
  const { data: budgets, isLoading: loadingBudgets, error: budgetsByVehicleLoadError, isLoading: budgetsByVehicleLoading, refetch: refetchBudgetsByVehicle } = useBudgetsByVehicle(vehicle.vehicleId);
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [directServiceId, setDirectServiceId] = useState<number | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const mine = (services ?? []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function handleInvoice(serviceId: number) {
    setWorkingId(serviceId);
    try {
      const budget = budgets?.find((b) => b.serviceId === serviceId);
      if (!budget) { setDirectServiceId(serviceId); return; }
      const invoice = await createInvoice.mutateAsync({ serviceId, budgetId: budget.budgetId });
      setMessage({ type: "ok", text: `Factura ${invoice.number} emitida por ${formatMoney(invoice.total)}.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "No se pudo emitir la factura." });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDirectInvoice(serviceId: number, details: InvoiceDetailRequest[]) {
    setWorkingId(serviceId);
    try {
      const invoice = await createInvoice.mutateAsync({ serviceId, details });
      setDirectServiceId(null);
      setMessage({ type: "ok", text: `Factura ${invoice.number} emitida por ${formatMoney(invoice.total)}.` });
    } finally { setWorkingId(null); }
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

  const loadError = servicesByVehicleLoadError ?? invoicesByVehicleLoadError ?? budgetsByVehicleLoadError;
  if (loadError) return <ErrorState error={loadError} resource="la facturación" onRetry={() => { if (servicesByVehicleLoadError) void refetchServicesByVehicle(); if (invoicesByVehicleLoadError) void refetchInvoicesByVehicle(); if (budgetsByVehicleLoadError) void refetchBudgetsByVehicle(); }} />;
  if (servicesByVehicleLoading || invoicesByVehicleLoading || budgetsByVehicleLoading) return <LoadingState label="Cargando la facturación..." />;

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
          {isLoading && <EmptyRow colSpan={5}><LoadingState label="Cargando facturación..." className="py-0" /></EmptyRow>}
          {!isLoading && mine.length === 0 && <EmptyRow colSpan={5}>Este vehículo todavía no tiene services cargados.</EmptyRow>}
          {mine.map((service) => {
            const invoice = invoices?.find((i) => i.serviceId === service.serviceId);
            const busy = workingId === (invoice?.invoiceId ?? service.serviceId);

            return (
              <Fragment key={service.serviceId}>
              <TR data-invoice-service-id={service.serviceId}>
                <TD>{service.serviceType}</TD>
                <TD className="text-muted">{formatDate(service.date)}</TD>
                <TD className="font-bold">{invoice ? formatMoney(invoice.total) : "—"}</TD>
                <TD>{invoice ? <Badge status={invoice.status} /> : <Badge status="draft" />}</TD>
                <TD className="flex gap-2">
                  {!invoice && (
                    <Button size="sm" loading={busy} disabled={busy || loadingBudgets} onClick={() => handleInvoice(service.serviceId)}>
                      Facturar
                    </Button>
                  )}
                  {invoice?.status === "issued" && (
                    <>
                      <Button size="sm" loading={busy} disabled={busy} onClick={() => handleStatus(invoice.invoiceId, "paid")}>
                        Cobrar
                      </Button>
                      <Button size="sm" variant="danger" loading={busy} disabled={busy} onClick={() => handleStatus(invoice.invoiceId, "cancelled")}>
                        Anular
                      </Button>
                    </>
                  )}
                </TD>
              </TR>
              {!invoice && directServiceId === service.serviceId && <TR><TD colSpan={5}>
                <DirectInvoiceForm key={service.serviceId} serviceType={service.serviceType}
                  onSubmit={details => handleDirectInvoice(service.serviceId, details)} onCancel={() => setDirectServiceId(null)} />
              </TD></TR>}
              </Fragment>
            );
          })}
        </TBody>
      </TableWrapper>
    </div>
  );
}
