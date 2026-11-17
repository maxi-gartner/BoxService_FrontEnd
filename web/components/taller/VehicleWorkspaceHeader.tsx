"use client";
import { useState } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api/clients";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useVehicleWorkOrder, useReceiveVehicle, useAdvanceWorkOrder } from "@/hooks/useWorkOrders";
import { ApiClientError } from "@/lib/api/client";
import type { Vehicle, WorkOrderStatus } from "@/types/entities";

const NEXT_STATUS: Record<WorkOrderStatus, WorkOrderStatus | null> = {
  en_espera: "en_proceso",
  en_proceso: "terminado",
  terminado: "entregado",
  entregado: null,
};
const NEXT_LABEL: Record<WorkOrderStatus, string> = {
  en_espera: "Pasar a en proceso",
  en_proceso: "Marcar terminado",
  terminado: "Entregar al cliente",
  entregado: "Recibir de nuevo",
};

export function VehicleWorkspaceHeader({ vehicle }: { vehicle: Vehicle }) {
  const { data: client, error: clientLoadError, isLoading: clientLoading, refetch: refetchClient } = useQuery({ queryKey: ["clients", vehicle.clientId], queryFn: () => clientsApi.getById(vehicle.clientId) });
  const { data: workOrder } = useVehicleWorkOrder(vehicle.vehicleId);
  const receive = useReceiveVehicle();
  const advance = useAdvanceWorkOrder();
  const [error, setError] = useState("");

  async function handleReceive() {
    setError("");
    try { await receive.mutateAsync({ vehicleId: vehicle.vehicleId }); }
    catch (err) { setError(err instanceof ApiClientError ? err.message : "No se pudo recibir el vehículo."); }
  }

  async function handleAdvance(orderId: number, next: WorkOrderStatus) {
    setError("");
    try { await advance.mutateAsync({ id: orderId, status: next }); }
    catch (err) { setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar el estado."); }
  }

  const loadError = clientLoadError;
  if (loadError) return <ErrorState error={loadError} resource="la información" onRetry={() => { if (clientLoadError) void refetchClient(); }} />;
  if (clientLoading) return <LoadingState label="Cargando la información..." />;

  const busy = receive.isPending || advance.isPending;
  const next = workOrder?.status ? NEXT_STATUS[workOrder.status] : null;

  return (
    <Card className="mb-4 border-l-2 border-l-accent">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🚗</span>
          <div>
            <h2 className="text-lg font-bold">{vehicle.brand} {vehicle.model}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted mt-1">
              <span className="text-accent font-semibold">{vehicle.plate}</span>
              <span>{client?.name ?? `Cliente #${vehicle.clientId}`}</span>
              <span>{vehicle.currentMileage.toLocaleString("es-AR")} km</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {workOrder?.status && <Badge status={workOrder.status} />}
          {!workOrder?.orderId && (
            <Button size="sm" variant="secondary" loading={busy} disabled={busy} onClick={handleReceive}>
              Recibir vehículo
            </Button>
          )}
          {workOrder?.orderId && workOrder.status === "entregado" && (
            <Button size="sm" variant="secondary" loading={busy} disabled={busy} onClick={handleReceive}>
              {NEXT_LABEL.entregado}
            </Button>
          )}
          {workOrder?.orderId && workOrder.status && workOrder.status !== "entregado" && next && (
            <Button size="sm" variant="secondary" loading={busy} disabled={busy} onClick={() => handleAdvance(workOrder.orderId!, next)}>
              {NEXT_LABEL[workOrder.status]}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
