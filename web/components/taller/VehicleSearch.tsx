"use client";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { TableWrapper, THead, TBody, TR, TD, EmptyRow } from "@/components/ui/Table";
import { NewClientVehicleForm, VehicleStep } from "@/components/taller/NewClientVehicleForm";
import type { Client, Vehicle } from "@/types/entities";

type Mode =
  | { kind: "buscar" }
  | { kind: "nuevo-cliente" }
  | { kind: "nuevo-vehiculo"; client: Client };

export function VehicleSearch({
  selectedVehicleId,
  onSelect,
}: {
  selectedVehicleId: number | null;
  onSelect: (vehicle: Vehicle) => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "buscar" });
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term);
  // Búsqueda server-side (patente/marca/modelo/cliente, ver
  // VehicleRepository.GetPaged) — antes esto bajaba TODOS los vehículos
  // del tenant para filtrar acá en el navegador.
  const { data: vehiclesPage, isLoading, error: vehiclesLoadError, isLoading: vehiclesLoading, refetch: refetchVehicles } = useVehicles({ page, pageSize: 20, search: debouncedTerm || undefined });
  const vehicles = vehiclesPage?.items ?? [];

  // Clientes que matchean la búsqueda (no solo vehículos): si el cliente
  // ya existe pero el auto que trae es nuevo (o el que buscan es otro),
  // esto deja ir directo a "Registrar nuevo vehículo" para ese cliente
  // sin repetir el alta. Siempre primero en la lista. Solo se pide con
  // término activo — sin él bajaría la primera página de TODOS los
  // clientes en cada visita a Taller.
  const { data: matchedClientsPage } = useClients(
    { pageSize: 5, search: debouncedTerm || undefined },
    { enabled: !!debouncedTerm },
  );
  const matchedClients = debouncedTerm ? matchedClientsPage?.items ?? [] : [];

  // Reset de página al cambiar el buscador — ajuste de estado durante el
  // render (patrón recomendado por React), no un efecto.
  const [termForPage, setTermForPage] = useState(debouncedTerm);
  if (debouncedTerm !== termForPage) {
    setTermForPage(debouncedTerm);
    setPage(1);
  }

  if (mode.kind === "nuevo-cliente") {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Nuevo cliente</CardTitle>
          <button onClick={() => setMode({ kind: "buscar" })} className="text-sm text-muted hover:text-light">
            ← Buscar existente
          </button>
        </div>
        <NewClientVehicleForm onCreated={onSelect} onCancel={() => setMode({ kind: "buscar" })} />
      </Card>
    );
  }

  if (mode.kind === "nuevo-vehiculo") {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Nuevo vehículo</CardTitle>
          <button onClick={() => setMode({ kind: "buscar" })} className="text-sm text-muted hover:text-light">
            ← Buscar existente
          </button>
        </div>
        <VehicleStep client={mode.client} onCreated={onSelect} onCancel={() => setMode({ kind: "buscar" })} />
      </Card>
    );
  }

  const loadError = vehiclesLoadError;
  if (loadError) return <ErrorState error={loadError} resource="los vehículos" onRetry={() => { if (vehiclesLoadError) void refetchVehicles(); }} />;
  if (vehiclesLoading) return <LoadingState label="Cargando los vehículos..." />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="mb-0">Buscar cliente / vehículo</CardTitle>
        <button onClick={() => setMode({ kind: "nuevo-cliente" })} className="text-sm text-accent hover:underline">
          + Nuevo cliente
        </button>
      </div>
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
          {isLoading && <EmptyRow colSpan={5}><LoadingState label="Cargando..." className="py-0" /></EmptyRow>}
          {!isLoading && vehicles.length === 0 && matchedClients.length === 0 && (
            <EmptyRow colSpan={5}>No se encontraron vehículos.</EmptyRow>
          )}
          {matchedClients.map((c) => (
            <TR key={`client-${c.clientId}`}>
              <TD className="font-semibold">{c.name}</TD>
              <TD className="text-muted text-xs">Cliente existente</TD>
              <TD className="text-muted text-xs">—</TD>
              <TD className="text-muted text-xs">—</TD>
              <TD>
                <Button size="sm" variant="secondary" onClick={() => setMode({ kind: "nuevo-vehiculo", client: c })}>
                  + Registrar nuevo vehículo
                </Button>
              </TD>
            </TR>
          ))}
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
