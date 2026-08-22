"use client";

import { useVehicleHistory } from "@/hooks/useVehicles";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import type { Vehicle } from "@/types/entities";

export function HistoryList({ vehicle }: { vehicle: Vehicle }) {
  const { data: history, isLoading } = useVehicleHistory(vehicle.vehicleId);

  return (
    <TableWrapper>
      <THead>
        <th>Fecha</th>
        <th>KM</th>
        <th>Tipo</th>
        <th>Observaciones</th>
        <th>Próx. KM</th>
        <th>Próx. Fecha</th>
      </THead>
      <TBody>
        {isLoading && <EmptyRow colSpan={6}>Cargando historial...</EmptyRow>}
        {!isLoading && history?.length === 0 && <EmptyRow colSpan={6}>Este vehículo todavía no tiene services registrados.</EmptyRow>}
        {history?.map((s) => (
          <TR key={s.serviceId}>
            <TD>{formatDate(s.date)}</TD>
            <TD>{s.mileage}</TD>
            <TD>{s.serviceType}</TD>
            <TD>{s.notes || "-"}</TD>
            <TD>{s.nextMileage ?? "-"}</TD>
            <TD>{formatDate(s.nextDate)}</TD>
          </TR>
        ))}
      </TBody>
    </TableWrapper>
  );
}
