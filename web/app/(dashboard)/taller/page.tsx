"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useVehicles } from "@/hooks/useVehicles";
import { VehicleSearch } from "@/components/taller/VehicleSearch";
import { VehicleSummary } from "@/components/taller/VehicleSummary";
import { NewBudgetTab } from "@/components/taller/NewBudgetTab";
import { NewServiceTab } from "@/components/taller/NewServiceTab";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/entities";

type Tab = "buscar" | "resumen" | "nuevo-presupuesto" | "nuevo-service";

const TABS: { id: Tab; label: string }[] = [
  { id: "buscar", label: "🔍 Buscar vehículo" },
  { id: "resumen", label: "📋 Resumen" },
  { id: "nuevo-presupuesto", label: "📝 Nuevo presupuesto" },
  { id: "nuevo-service", label: "🔧 Nuevo service" },
];

function TallerContent() {
  const searchParams = useSearchParams();
  const { data: vehicles } = useVehicles();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("buscar");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Deep-link: /taller?id=123 salta directo al resumen de ese vehículo.
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (!idParam || !vehicles) return;
    const vehicle = vehicles.find((v) => v.vehicleId === Number(idParam));
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setTab("resumen");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  function handleSelect(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setTab("resumen");
  }

  function handleChanged() {
    queryClient.invalidateQueries();
  }

  const requiresVehicle = tab !== "buscar" && !selectedVehicle;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Taller</h1>

      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-light",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "buscar" && <VehicleSearch selectedVehicleId={selectedVehicle?.vehicleId ?? null} onSelect={handleSelect} />}

      {requiresVehicle && (
        <p className="text-muted">Ningún vehículo seleccionado. Elegilo en la pestaña &quot;Buscar vehículo&quot;.</p>
      )}

      {tab === "resumen" && selectedVehicle && <VehicleSummary vehicle={selectedVehicle} onChanged={handleChanged} />}
      {tab === "nuevo-presupuesto" && selectedVehicle && (
        <NewBudgetTab vehicle={selectedVehicle} onCreated={handleChanged} />
      )}
      {tab === "nuevo-service" && selectedVehicle && <NewServiceTab vehicle={selectedVehicle} />}
    </div>
  );
}

export default function TallerPage() {
  return (
    <Suspense fallback={<p className="text-muted">Cargando...</p>}>
      <TallerContent />
    </Suspense>
  );
}
