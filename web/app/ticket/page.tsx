"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/lib/api/services";
import { vehiclesApi } from "@/lib/api/vehicles";
import { clientsApi } from "@/lib/api/clients";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

function TicketContent() {
  const serviceId = Number(useSearchParams().get("serviceId"));

  const { data: service } = useQuery({
    queryKey: ["services", serviceId],
    queryFn: () => servicesApi.getById(serviceId),
    enabled: !!serviceId,
  });
  const { data: details } = useQuery({
    queryKey: ["services", serviceId, "details"],
    queryFn: () => servicesApi.getDetails(serviceId),
    enabled: !!serviceId,
  });
  const { data: vehicle } = useQuery({
    queryKey: ["vehicles", service?.vehicleId],
    queryFn: () => vehiclesApi.getById(service!.vehicleId),
    enabled: !!service,
  });
  const { data: client } = useQuery({
    queryKey: ["clients", vehicle?.clientId],
    queryFn: () => clientsApi.getById(vehicle!.clientId),
    enabled: !!vehicle,
  });

  if (!service || !vehicle || !client) {
    return <p className="text-muted text-center mt-20">Cargando...</p>;
  }

  const row = (label: string, value: string) => (
    <div className="flex justify-between py-2 border-b border-border-light text-sm">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex justify-center py-10 px-4 bg-bg">
      <div className="w-full max-w-md">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button variant="secondary" size="sm" onClick={() => window.close()}>
            Cerrar
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            Imprimir
          </Button>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 text-sm">
          <div className="text-center mb-5 pb-4 border-b border-dashed border-border">
            <p className="text-xl font-bold text-accent">BoxService</p>
            <p className="text-xs uppercase text-muted tracking-wide mt-1">
              Comprobante de trabajo — no válido como factura
            </p>
          </div>

          {row("Fecha", formatDate(service.date))}
          {row("Cliente", client.name)}
          {row("Vehículo", `${vehicle.brand} ${vehicle.model}`)}
          {row("Patente", vehicle.plate)}
          {row("Kilometraje", String(service.mileage))}
          {row("Tipo de service", service.serviceType)}

          <p className="mt-4 mb-2 font-bold">Detalle del trabajo</p>
          {details?.length ? (
            details.map((d) => (
              <p key={d.detailId} className="py-1 text-sm before:content-['•_'] before:text-accent">
                {d.description}
              </p>
            ))
          ) : (
            <p className="text-muted">Sin detalle cargado.</p>
          )}

          <p className="mt-6 pt-4 border-t border-dashed border-border text-center text-xs text-muted">
            Service #{service.serviceId} — generado desde BoxService
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center mt-20">Cargando...</p>}>
      <TicketContent />
    </Suspense>
  );
}
