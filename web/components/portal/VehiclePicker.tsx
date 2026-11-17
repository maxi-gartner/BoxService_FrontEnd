"use client";
import { useState } from "react";
import { VehicleCard } from "./VehicleCard";
import { cn } from "@/lib/utils";
import type { PortalVehicle } from "@/types/portal";

// Con un solo auto no hace falta elegir nada. Con más de uno, mostrar
// TODOS a la vez (como antes) dejaba una grilla desprolija — autos con
// mucho historial al lado de autos vacíos, todo desparejo. Ahora se ve
// uno a la vez, a todo el ancho, y se elige cuál arriba.
export function VehiclePicker({ vehicles }: { vehicles: PortalVehicle[] }) {
  const [selectedId, setSelectedId] = useState(vehicles[0]?.vehicle.vehicleId ?? null);

  if (vehicles.length === 0) return null;
  if (vehicles.length === 1) return <VehicleCard {...vehicles[0]} />;

  const selected = vehicles.find((v) => v.vehicle.vehicleId === selectedId) ?? vehicles[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {vehicles.map(({ vehicle }) => {
          const active = vehicle.vehicleId === selected.vehicle.vehicleId;
          return (
            <button
              key={vehicle.vehicleId}
              type="button"
              onClick={() => setSelectedId(vehicle.vehicleId)}
              className={cn(
                "shrink-0 rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                active ? "border-accent bg-accent-dim text-accent" : "border-border text-muted hover:text-light",
              )}
            >
              <span className="block font-semibold">{vehicle.brand} {vehicle.model}</span>
              <span className="block text-xs">{vehicle.plate}</span>
            </button>
          );
        })}
      </div>
      <VehicleCard {...selected} />
    </div>
  );
}
