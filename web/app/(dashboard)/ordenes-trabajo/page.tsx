"use client";
import { useState } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { VehicleSearch } from "@/components/taller/VehicleSearch";
import { useOpenWorkOrders, useAdvanceWorkOrder, useReceiveVehicle, useCancelWorkOrder } from "@/hooks/useWorkOrders";
import { ApiClientError } from "@/lib/api/client";
import { NEXT_STATUS, NEXT_LABEL, type OpenWorkOrderStatus } from "@/lib/workOrderTransitions";
import type { Vehicle, WorkOrderStatus } from "@/types/entities";

const COLUMNS: { status: OpenWorkOrderStatus; title: string }[] = [
  { status: "en_espera", title: "En espera" },
  { status: "en_proceso", title: "En proceso" },
  { status: "terminado", title: "Terminado" },
];

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `hace ${Math.max(0, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

export default function OrdenesTrabajoPage() {
  const orders = useOpenWorkOrders();
  const advance = useAdvanceWorkOrder();
  const cancel = useCancelWorkOrder();
  const receive = useReceiveVehicle();
  const [showReceive, setShowReceive] = useState(false);
  const [error, setError] = useState("");

  // Nada de advance.isPending/cancel.isPending en los botones de abajo:
  // son mutaciones COMPARTIDAS por todas las tarjetas del tablero, así
  // que atarles el loading/disabled dejaría a TODAS las tarjetas
  // congeladas apenas se clickea una sola. El propio <Button> ya trackea
  // su busy-state por click (ver components/ui/Button.tsx), que es lo
  // que corresponde acá.
  async function handleAdvance(id: number, next: WorkOrderStatus) {
    setError("");
    try { await advance.mutateAsync({ id, status: next }); }
    catch (err) { setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar el estado."); }
  }

  async function handleCancel(id: number) {
    setError("");
    try { await cancel.mutateAsync(id); }
    catch (err) { setError(err instanceof ApiClientError ? err.message : "No se pudo cancelar la recepción."); }
  }

  async function handleReceive(vehicle: Vehicle) {
    setError("");
    try {
      await receive.mutateAsync({ vehicleId: vehicle.vehicleId });
      setShowReceive(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo recibir el vehículo.");
    }
  }

  const loadError = orders.error;
  if (loadError) return <ErrorState error={loadError} resource="las órdenes de trabajo" onRetry={() => void orders.refetch()} />;
  if (orders.isLoading) return <LoadingState label="Cargando las órdenes de trabajo..." />;

  const rows = orders.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de trabajo</h1>
          <p className="mt-1 text-sm text-muted">Qué auto está en qué paso, ahora mismo.</p>
        </div>
        <Button variant="secondary" onClick={() => setShowReceive((v) => !v)}>
          {showReceive ? "Cancelar" : "+ Recibir vehículo"}
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {showReceive && <VehicleSearch selectedVehicleId={null} onSelect={handleReceive} />}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = rows.filter((o) => o.status === column.status);
          return (
            <div key={column.status} className="space-y-3">
              <h2 className="flex items-center gap-2 font-semibold text-light">
                {column.title}
                <span className="text-xs font-normal text-muted">({items.length})</span>
              </h2>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="rounded-lg border border-border p-4 text-sm text-muted">Nada acá.</p>
                )}
                {items.map((order) => (
                  <Card key={order.orderId} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{order.vehicle}</p>
                        <p className="text-sm text-accent">{order.plate}</p>
                      </div>
                      <Badge status={order.status} />
                    </div>
                    <p className="text-sm text-muted">{order.clientName}</p>
                    <p className="text-xs text-muted">Recibido {timeAgo(order.createdAt)}</p>
                    {order.notes && <p className="text-xs italic text-muted">&quot;{order.notes}&quot;</p>}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAdvance(order.orderId, NEXT_STATUS[column.status])}
                      >
                        {NEXT_LABEL[column.status]}
                      </Button>
                      {column.status === "en_espera" && (
                        <Button size="sm" variant="secondary" onClick={() => handleCancel(order.orderId)}>
                          Cancelar
                        </Button>
                      )}
                      <Link href={`/taller?id=${order.vehicleId}`} className="text-sm text-accent hover:underline">
                        Ver vehículo
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
