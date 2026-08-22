import { Card } from "@/components/ui/Card";
import type { Vehicle } from "@/types/entities";

export function VehicleInfoCard({ vehicle, clientName }: { vehicle: Vehicle; clientName: string }) {
  const fields = [
    { label: "Cliente", value: clientName, accent: true },
    { label: "Vehículo", value: `${vehicle.brand} ${vehicle.model}` },
    { label: "Patente", value: vehicle.plate, accent: true },
    { label: "KM actual", value: String(vehicle.currentMileage) },
  ];

  return (
    <Card className="border-l-2 border-l-accent">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs uppercase text-muted mb-1">{f.label}</p>
            <p className={`text-lg font-bold ${f.accent ? "text-accent" : "text-light"}`}>{f.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
