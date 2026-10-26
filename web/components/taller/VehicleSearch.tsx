"use client";

import { useEffect, useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import type { Vehicle } from "@/types/entities";

export function VehicleSearch({
  selectedVehicleId,
  onSelect,
}: {
  selectedVehicleId: number | null;
  onSelect: (vehicle: Vehicle) => void;
}) {
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term);
  // Búsqueda server-side (patente/marca/modelo/cliente, ver
  // VehicleRepository.GetPaged) — antes esto bajaba TODOS los vehículos
  // del tenant para filtrar acá en el navegador.
  const { data: vehiclesPage, isLoading } = useVehicles({ page, pageSize: 20, search: debouncedTerm || undefined });
  const vehicles = vehiclesPage?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedTerm]);

  return (
    <Card>
      <CardTitle>Buscar cliente / vehículo</CardTitle>
      <Input
        placeholder="Ej: ABC123 · Juan Pérez · Toyota"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="mb-4"
      />

      <TableWrapper>
        <THead>
          <th>Cliente</th>
          <th>Marca / Modelo</th>
          <th>Patente</th>
          <th>KM actual</th>
          <th></th>
        </THead>
        <TBody>
          {isLoading && <EmptyRow colSpan={5}>Cargando...</EmptyRow>}
          {!isLoading && vehicles.length === 0 && <EmptyRow colSpan={5}>No se encontraron vehículos.</EmptyRow>}
          {vehicles.map((v) => {
            const isSelected = v.vehicleId === selectedVehicleId;
            return (
              <TR key={v.vehicleId} className={isSelected ? "bg-accent-dim" : ""}>
                <TD>{v.clientName ?? `Cliente #${v.clientId}`}</TD>
                <TD>
                  {v.brand} {v.model}
                </TD>
                <TD className="text-accent">{v.plate}</TD>
                <TD>{v.currentMileage}</TD>
                <TD>
                  <Button size="sm" variant={isSelected ? "primary" : "secondary"} onClick={() => onSelect(v)}>
                    {isSelected ? "Seleccionado" : "Elegir"}
                  </Button>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </TableWrapper>
      {vehiclesPage && (
        <Pagination
          page={vehiclesPage.page}
          totalPages={vehiclesPage.totalPages}
          totalCount={vehiclesPage.totalCount}
          onPageChange={setPage}
        />
      )}
    </Card>
  );
}
