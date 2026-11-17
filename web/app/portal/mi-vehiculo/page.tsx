import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PORTAL_TOKEN_COOKIE } from "@/lib/auth/portalCookies";
import { VehicleCard } from "@/components/portal/VehicleCard";
import type { PortalMe } from "@/types/portal";

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
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      {/* max-w chico en mobile (ocupa todo el ancho útil), más generoso
          en desktop — sin esto quedaba una columna angosta de 448px
          perdida en el medio de una pantalla grande. */}
      <div className="mx-auto max-w-md space-y-6 sm:max-w-2xl sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-8 lg:max-w-4xl">
        <div className="flex flex-col gap-1 border-b border-border pb-4 sm:border-none sm:pb-0">
          <p className="text-sm text-accent">⚙ BoxService</p>
          <h1 className="text-xl font-bold text-light sm:text-2xl">Hola, {client.name}</h1>
        </div>

        {vehicles.length === 0 && (
          <p className="text-sm text-muted">Todavía no tenés vehículos cargados.</p>
        )}

        <div className="space-y-6 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 lg:grid-cols-3">
          {vehicles.map((item) => (
            <VehicleCard key={item.vehicle.vehicleId} {...item} />
          ))}
        </div>
      </div>
    </main>
  );
}
