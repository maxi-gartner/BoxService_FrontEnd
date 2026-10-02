"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api/clients";
import { useVehicles } from "@/hooks/useVehicles";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import type { Vehicle } from "@/types/entities";

export function VehicleSearch({
  selectedVehicleId,
  onSelect,
}: {
  selectedVehicleId: number | null;
  onSelect: (vehicle: Vehicle) => void;
}) {
  const [term, setTerm] = useState("");
  const { data: vehicles, isLoading } = useVehicles();
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });

  const clientsById = useMemo(() => {
    const map = new Map<number, string>();
    clients?.forEach((c) => map.set(c.clientId, c.name));
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    const words = term.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return vehicles;

    return vehicles.filter((v) => {
      const haystack = `${clientsById.get(v.clientId) ?? ""} ${v.plate} ${v.brand} ${v.model}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }, [vehicles, term, clientsById]);

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
          {!isLoading && filtered.length === 0 && <EmptyRow colSpan={5}>No se encontraron vehículos.</EmptyRow>}
          {filtered.map((v) => {
            const isSelected = v.vehicleId === selectedVehicleId;
            return (
              <TR key={v.vehicleId} className={isSelected ? "bg-accent-dim" : ""}>
                <TD>{clientsById.get(v.clientId) ?? `Cliente #${v.clientId}`}</TD>
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
    </Card>
  );
}
