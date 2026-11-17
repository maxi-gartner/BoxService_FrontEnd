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
import { NEXT_STATUS, NEXT_LABEL } from "@/lib/workOrderTransitions";
import type { Vehicle, WorkOrderStatus } from "@/types/entities";

export function VehicleWorkspaceHeader({ vehicle }: { vehicle: Vehicle }) {
  const { data: client, error: clientLoadError, isLoading: clientLoading, refetch: refetchClient } = useQuery({ queryKey: ["clients", vehicle.clientId], queryFn: () => clientsApi.getById(vehicle.clientId) });
  // isLoading (no solo "data"): mientras esto todavía no respondió,
  // workOrder es undefined y no hay que leerlo como "nunca se recibió" —
  // si no, por un instante se muestra "Recibir vehículo" para un auto
  // que ya tiene una orden abierta, y un click ahí dispara un 409 en vez
  // de la acción que la persona realmente quería (avanzar el estado).
  const { data: workOrder, isLoading: workOrderLoading } = useVehicleWorkOrder(vehicle.vehicleId);
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
  if (clientLoading || workOrderLoading) return <LoadingState label="Cargando la información..." />;

  const busy = receive.isPending || advance.isPending;
  const next = workOrder?.status && workOrder.status !== "entregado" ? NEXT_STATUS[workOrder.status] : null;

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
              Recibir de nuevo
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
