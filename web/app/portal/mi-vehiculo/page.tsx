import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PORTAL_TOKEN_COOKIE } from "@/lib/auth/portalCookies";

type PortalBudgetDetail = { description: string; quantity: number; unitPrice: number; subtotal: number };
type PortalBudget = {
  budget: { budgetId: number; number: string; date: string; status: string };
  details: PortalBudgetDetail[];
  total: number;
};
type PortalService = { serviceId: number; date: string; mileage: number; serviceType: string; notes: string };
type PortalVehicle = {
  vehicle: {
    vehicleId: number;
    brand: string;
    model: string;
    plate: string;
    year: number | null;
    currentMileage: number;
  };
  budgets: PortalBudget[];
  services: PortalService[];
};
type PortalMe = { client: { clientId: number; name: string }; vehicles: PortalVehicle[] };

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  completed: "Completado",
  rejected: "Rechazado",
};

// Server Component, no pasa por el proxy genérico de staff (ese está
// atado a la cookie de staff) — para un solo endpoint de solo lectura no
// hace falta montar un segundo proxy, se pide directo acá.
export default async function MiVehiculoPage() {
  const token = (await cookies()).get(PORTAL_TOKEN_COOKIE)?.value;
  if (!token) redirect("/portal");

  const res = await fetch(`${process.env.BACKEND_URL}/portal/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) redirect("/portal");

  if (!res.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg px-4 text-center text-light">
        No pudimos cargar tu información ahora. Probá de nuevo más tarde.
      </main>
    );
  }

  const json = (await res.json()) as { data: PortalMe };
  const { client, vehicles } = json.data;

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <p className="text-accent text-sm">⚙ BoxService</p>
          <h1 className="text-xl font-bold text-light">Hola, {client.name}</h1>
        </div>

        {vehicles.length === 0 && (
          <p className="text-sm text-muted">Todavía no tenés vehículos cargados.</p>
        )}

        {vehicles.map(({ vehicle, budgets, services }) => (
          <div key={vehicle.vehicleId} className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <div>
              <p className="font-semibold text-light">
                {vehicle.brand} {vehicle.model}
              </p>
              <p className="text-sm text-muted">
                {vehicle.plate}
                {vehicle.year ? ` · ${vehicle.year}` : ""} · {vehicle.currentMileage} km
              </p>
            </div>

            {budgets.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-light mb-2">Presupuestos</p>
                <div className="space-y-2">
                  {budgets.map(({ budget, details, total }) => (
                    <div key={budget.budgetId} className="rounded-md bg-surface-2 p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-light">{budget.number}</span>
                        <span className="text-accent">{STATUS_LABELS[budget.status] ?? budget.status}</span>
                      </div>
                      <ul className="mt-1 text-muted space-y-0.5">
                        {details.map((d, i) => (
                          <li key={i}>
                            {d.description} — ${d.subtotal.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-light font-medium">Total: ${total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-light mb-2">Historial de service</p>
                <ul className="space-y-1 text-sm text-muted">
                  {services.map((s) => (
                    <li key={s.serviceId}>
                      {s.date} — {s.serviceType} ({s.mileage} km)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {budgets.length === 0 && services.length === 0 && (
              <p className="text-sm text-muted">Todavía no hay movimientos para este vehículo.</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
