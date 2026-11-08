"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useVehicleById } from "@/hooks/useVehicles";
import { VehicleSearch } from "@/components/taller/VehicleSearch";
import { VehicleWorkspaceHeader } from "@/components/taller/VehicleWorkspaceHeader";
import { VehicleOverview } from "@/components/taller/VehicleOverview";
import { BudgetsList } from "@/components/taller/BudgetsList";
import { HistoryList } from "@/components/taller/HistoryList";
import { InvoicingList } from "@/components/taller/InvoicingList";
import { NewBudgetTab } from "@/components/taller/NewBudgetTab";
import { NewServiceTab } from "@/components/taller/NewServiceTab";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/entities";

type View =
  | "buscar"
  | "resumen"
  | "presupuestos"
  | "historial"
  | "facturacion"
  | "nuevo-presupuesto"
  | "nuevo-service";

const SECTIONS: { id: View; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "presupuestos", label: "Presupuestos" },
  { id: "historial", label: "Historial" },
  { id: "facturacion", label: "Facturación" },
];

// Mismos tabs que SECTIONS (misma barra, mismo hover/resaltado) en vez de
// botones aparte arriba — así armar un presupuesto o un service se ve
// como "entrar a otra sección", no como una acción fuera de lugar.
const ACTIONS: { id: View; label: string }[] = [
  { id: "nuevo-presupuesto", label: "+ Nuevo presupuesto" },
  { id: "nuevo-service", label: "+ Registrar service" },
];

function TallerContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  // Un pedido directo por ID, no la lista completa de vehículos — antes
  // esta pantalla bajaba TODOS los vehículos solo para resolver el
  // deep-link /taller?id=123.
  const { data: deepLinkVehicle } = useVehicleById(idParam ? Number(idParam) : null);
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>("buscar");
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  // Deep-link: /taller?id=123 abre directamente la ficha del vehículo.
  useEffect(() => {
    if (!deepLinkVehicle) return;

    // Hay que esperar a que "deepLinkVehicle" (async, React Query) esté
    // disponible para poder resolver el vehículo — no se puede calcular
    // puramente en el render mientras tanto.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedVehicle(deepLinkVehicle);
    setView("resumen");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [deepLinkVehicle]);

  function handleSelect(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setView("resumen");
  }

  function handleChanged() {
    queryClient.invalidateQueries();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Taller</h1>

          <p className="text-sm text-muted mt-1">
            {view === "buscar"
              ? "Buscá un vehículo para comenzar una atención."
              : "Ficha de trabajo del vehículo."}
          </p>
        </div>

        {selectedVehicle && view !== "buscar" && (
          <button
            onClick={() => setView("buscar")}
            className="text-sm text-muted hover:text-light"
          >
            ← Cambiar vehículo
          </button>
        )}
      </div>

      {view === "buscar" && (
        <VehicleSearch
          selectedVehicleId={selectedVehicle?.vehicleId ?? null}
          onSelect={handleSelect}
        />
      )}

      {selectedVehicle && view !== "buscar" && (
        <>
          <VehicleWorkspaceHeader vehicle={selectedVehicle} />

          <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setView(section.id)}
                className={cn(
                  "px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                  view === section.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-light",
                )}
              >
                {section.label}
              </button>
            ))}
            <div className="ml-auto flex gap-1">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setView(action.id)}
                  className={cn(
                    "px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                    view === action.id
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-light",
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {view === "resumen" && selectedVehicle && (
        <VehicleOverview
          vehicle={selectedVehicle}
          onOpen={setView}
        />
      )}

      {view === "presupuestos" && selectedVehicle && (
        <Card>
          <CardTitle>Presupuestos</CardTitle>

          <BudgetsList
            vehicle={selectedVehicle}
            onChanged={handleChanged}
          />
        </Card>
      )}

      {view === "historial" && selectedVehicle && (
        <Card>
          <CardTitle>Historial de services</CardTitle>
          <HistoryList vehicle={selectedVehicle} />
        </Card>
      )}

      {view === "facturacion" && selectedVehicle && (
        <Card>
          <CardTitle>Facturación</CardTitle>
          <InvoicingList vehicle={selectedVehicle} />
        </Card>
      )}

      {view === "nuevo-presupuesto" && selectedVehicle && (
        <NewBudgetTab
          vehicle={selectedVehicle}
          onCreated={handleChanged}
        />
      )}

      {view === "nuevo-service" && selectedVehicle && (
        <NewServiceTab vehicle={selectedVehicle} />
      )}
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