// Formas de GET /portal/me (ver Api/PortalEndpoints.cs) — compartidas entre
// el Server Component que lo pide (app/portal/mi-vehiculo/page.tsx) y el
// Client Component que lo renderiza (components/portal/VehicleCard.tsx).
export type PortalBudgetDetail = { description: string; quantity: number; unitPrice: number; subtotal: number };
export type PortalBudget = {
  budget: { budgetId: number; number: string; date: string; status: string };
  details: PortalBudgetDetail[];
  total: number;
};
export type PortalServiceDetail = { detailId: number; serviceId: number; description: string; done: boolean };
export type PortalService = {
  service: { serviceId: number; date: string; mileage: number; serviceType: string; notes: string };
  details: PortalServiceDetail[];
};
export type PortalVehicle = {
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
export type PortalMe = { client: { clientId: number; name: string }; vehicles: PortalVehicle[] };
