"use client";

import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api/clients";
import { Card, CardTitle } from "@/components/ui/Card";
import { VehicleInfoCard } from "./VehicleInfoCard";
import { BudgetsList } from "./BudgetsList";
import { HistoryList } from "./HistoryList";
import { InvoicingList } from "./InvoicingList";
import type { Vehicle } from "@/types/entities";

export function VehicleSummary({ vehicle, onChanged }: { vehicle: Vehicle; onChanged: () => void }) {
  const { data: client } = useQuery({
    queryKey: ["clients", vehicle.clientId],
    queryFn: () => clientsApi.getById(vehicle.clientId),
  });

  return (
    <div className="space-y-6">
      <VehicleInfoCard vehicle={vehicle} clientName={client?.name ?? `Cliente #${vehicle.clientId}`} />

      <Card>
        <CardTitle>Presupuestos</CardTitle>
        <BudgetsList vehicle={vehicle} onChanged={onChanged} />
      </Card>

      <Card>
        <CardTitle>Historial de services</CardTitle>
        <HistoryList vehicle={vehicle} />
      </Card>

      <Card>
        <CardTitle>Facturación</CardTitle>
        <InvoicingList vehicle={vehicle} />
      </Card>
    </div>
  );
}
