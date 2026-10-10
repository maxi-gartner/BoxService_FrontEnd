"use client";

import { useState } from "react";
import { useVehicleHistory } from "@/hooks/useVehicles";
import { Button } from "@/components/ui/Button";
import { ServiceInspectionModal } from "@/components/taller/ServiceInspectionModal";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import type { Service, Vehicle } from "@/types/entities";

export function HistoryList({ vehicle }: { vehicle: Vehicle }) {
  const { data: history, isLoading } = useVehicleHistory(vehicle.vehicleId);
  const [inspectionService, setInspectionService] = useState<Service | null>(null);

  return (
    <>
      <TableWrapper>
        <THead>
          <th>Fecha</th>
          <th>KM</th>
          <th>Tipo</th>
          <th>Observaciones</th>
          <th>Próx. KM</th>
          <th>Próx. Fecha</th>
          <th></th>
        </THead>
        <TBody>
          {isLoading && <EmptyRow colSpan={7}>Cargando historial...</EmptyRow>}
          {!isLoading && history?.length === 0 && <EmptyRow colSpan={7}>Este vehículo todavía no tiene services registrados.</EmptyRow>}
          {history?.map((service) => (
            <TR key={service.serviceId}>
              <TD>{formatDate(service.date)}</TD>
              <TD>{service.mileage}</TD>
              <TD>{service.serviceType}</TD>
              <TD>{service.notes || "-"}</TD>
              <TD>{service.nextMileage ?? "-"}</TD>
              <TD>{formatDate(service.nextDate)}</TD>
              <TD>
                <Button type="button" size="sm" variant="secondary" onClick={() => setInspectionService(service)}>
                  Inspección
                </Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </TableWrapper>

      {inspectionService && (
        <ServiceInspectionModal
          service={inspectionService}
          onClose={() => setInspectionService(null)}
        />
      )}
    </>
  );
}
