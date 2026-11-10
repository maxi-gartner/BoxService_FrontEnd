"use client";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Suspense } from "react";
import { ApiClientError } from "@/lib/api/client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api/invoices";
import { budgetsApi } from "@/lib/api/budgets";
import { servicesApi } from "@/lib/api/services";
import { vehiclesApi } from "@/lib/api/vehicles";
import { clientsApi } from "@/lib/api/clients";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatMoney } from "@/lib/utils";

function InvoiceUnavailable({ code }: { code?: number }) {
  return <ErrorState code={code} resource="la factura" notFoundTitle="Factura no encontrada o sin acceso" fullPage href="/facturas" backLabel="Volver a Facturas" />;
}

function FacturaContent() {
  const invoiceId = Number(useSearchParams().get("id"));

  const validId = Number.isSafeInteger(invoiceId) && invoiceId > 0;

  const { data: invoice, isLoading, error: invoiceError } = useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: validId,
    retry: false,
  });
  const { data: service, isLoading: loadingService, error: serviceError } = useQuery({
    queryKey: ["services", invoice?.serviceId],
    queryFn: () => servicesApi.getById(invoice!.serviceId),
    enabled: !!invoice,
    retry: false,
  });
  const { data: vehicle, isLoading: loadingVehicle, error: vehicleError } = useQuery({
    queryKey: ["vehicles", service?.vehicleId],
    queryFn: () => vehiclesApi.getById(service!.vehicleId),
    enabled: !!service,
    retry: false,
  });
  const { data: client, isLoading: loadingClient, error: clientError } = useQuery({
    queryKey: ["clients", vehicle?.clientId],
    queryFn: () => clientsApi.getById(vehicle!.clientId),
    enabled: !!vehicle,
    retry: false,
  });
  // Las nuevas facturas conservan sus propios conceptos. El presupuesto
  // solo se consulta como respaldo para facturas anteriores sin copia del detalle.
  const { data: budget, isLoading: loadingBudget, error: budgetError } = useQuery({
    queryKey: ["budgets", invoice?.budgetId],
    queryFn: () => budgetsApi.getById(invoice!.budgetId as number),
    enabled: !!invoice?.budgetId && !invoice.details?.length,
    retry: false,
  });

  if (!validId) return <InvoiceUnavailable code={400} />;

  const error = invoiceError ?? serviceError ?? vehicleError ?? clientError ?? budgetError;
  if (error) return <InvoiceUnavailable code={error instanceof ApiClientError ? error.code : undefined} />;

  if (isLoading || loadingService || loadingVehicle || loadingClient || loadingBudget) {
    return <LoadingState label="Cargando..." />;
  }
  if (!invoice || !service || !vehicle || !client) return <InvoiceUnavailable code={404} />;

  const details = invoice.details?.length ? invoice.details : budget?.details ?? [];

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
              <p className="text-lg font-bold text-light">Factura</p>
              <p className="text-accent font-semibold">{invoice.number}</p>
              <div className="mt-1 flex justify-end">
                <Badge status={invoice.status} />
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
              <p className="text-muted">Fecha: {formatDate(invoice.date)}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="text-left py-2 font-medium">Descripción</th>
                {details.length > 0 && <th className="text-center py-2 font-medium w-20">Cant.</th>}
                {details.length > 0 && <th className="text-right py-2 font-medium w-28">Precio unit.</th>}
                <th className="text-right py-2 font-medium w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {details.length > 0 ? (
                details.map((d) => (
                  <tr key={d.detailId} className="border-b border-border-light">
                    <td className="py-2 text-light">{d.description}</td>
                    <td className="py-2 text-center text-muted">{d.quantity}</td>
                    <td className="py-2 text-right text-muted">{formatMoney(d.unitPrice)}</td>
                    <td className="py-2 text-right text-light">{formatMoney(d.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-border-light">
                  <td className="py-2 text-light">{service.serviceType}</td>
                  <td className="py-2 text-right text-light">{formatMoney(invoice.total)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="w-48 flex justify-between border-t border-border pt-3">
              <span className="font-bold text-light">Total</span>
              <span className="font-bold text-accent">{formatMoney(invoice.total)}</span>
            </div>
          </div>

          <p className="pt-4 border-t border-dashed border-border text-center text-xs text-muted">
            Factura {invoice.number} — generada desde BoxService a partir del service #{invoice.serviceId}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FacturaPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando..." />}>
      <FacturaContent />
    </Suspense>
  );
}
