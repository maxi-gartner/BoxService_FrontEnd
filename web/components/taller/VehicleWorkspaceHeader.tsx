"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api/clients";
import { Card } from "@/components/ui/Card";
import type { Vehicle } from "@/types/entities";

export function VehicleWorkspaceHeader({ vehicle }: { vehicle: Vehicle }) {
  const { data: client, error: clientLoadError, isLoading: clientLoading, refetch: refetchClient } = useQuery({ queryKey: ["clients", vehicle.clientId], queryFn: () => clientsApi.getById(vehicle.clientId) });
  const loadError = clientLoadError;
  if (loadError) return <ErrorState error={loadError} resource="la información" onRetry={() => { if (clientLoadError) void refetchClient(); }} />;
  if (clientLoading) return <LoadingState label="Cargando la información..." />;

  return (
    <Card className="mb-4 border-l-2 border-l-accent">
      <div className="flex items-center gap-3"><span className="text-2xl" aria-hidden="true">🚗</span><div><h2 className="text-lg font-bold">{vehicle.brand} {vehicle.model}</h2><div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted mt-1"><span className="text-accent font-semibold">{vehicle.plate}</span><span>{client?.name ?? `Cliente #${vehicle.clientId}`}</span><span>{vehicle.currentMileage.toLocaleString("es-AR")} km</span></div></div></div>
    </Card>
  );
}
