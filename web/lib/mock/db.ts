/**
 * Backend simulado — datos en memoria + JWTs firmados de verdad (con `jose`,
 * secreto de desarrollo) para poder ejercitar todo el flujo de auth real
 * sin tener el backend ASP.NET Core todavía.
 *
 * Se borra este archivo (y el resto de lib/mock/) el día que el backend
 * real esté listo — nada fuera de acá depende de esto, todo pasa por el
 * mismo proxy que usaría el backend de verdad. Ver docs/API_CONTRACT.md.
 */
import type {
  Budget,
  BudgetDetail,
  CatalogItem,
  Client,
  Invoice,
  Service,
  ServiceDetail,
  Tenant,
  Vehicle,
} from "@/types/entities";
import type { Role } from "@/types/auth";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string; // texto plano — SOLO porque esto es un mock de desarrollo
  role: Role;
  tenantId: string | null;
};

const TENANT_A = "t-lubricentro-sur";

export const db = {
  tenants: [{ tenantId: TENANT_A, name: "Lubricentro Sur", createdAt: "2026-01-01" }] as Tenant[],

  users: [
    {
      id: "u-1",
      name: "Maxi Gartner",
      email: "maxi@boxservice.com",
      password: "boxservice123",
      role: "owner",
      tenantId: TENANT_A,
    },
    {
      id: "u-2",
      name: "Cristhian Carrasco",
      email: "cris@boxservice.com",
      password: "boxservice123",
      role: "employee",
      tenantId: TENANT_A,
    },
    {
      id: "u-super",
      name: "Superadmin",
      email: "admin@boxservice.com",
      password: "boxservice123",
      role: "superadmin",
      tenantId: null,
    },
  ] as MockUser[],

  clients: [
    { clientId: 1, tenantId: TENANT_A, name: "Juan Pérez", phone: "3421234567", email: "juan@mail.com", createdAt: "2026-02-01" },
    { clientId: 2, tenantId: TENANT_A, name: "María Gómez", phone: "3427654321", email: "maria@mail.com", createdAt: "2026-02-03" },
  ] as Client[],

  vehicles: [
    { vehicleId: 1, tenantId: TENANT_A, clientId: 1, brand: "Toyota", model: "Corolla", year: 2020, plate: "AA111AA", currentMileage: 55000, createdAt: "2026-02-01" },
    { vehicleId: 2, tenantId: TENANT_A, clientId: 2, brand: "Ford", model: "Focus", year: 2018, plate: "AB222AB", currentMileage: 82000, createdAt: "2026-02-03" },
  ] as Vehicle[],

  budgets: [] as Budget[],
  budgetDetails: [] as BudgetDetail[],
  services: [] as Service[],
  serviceDetails: [] as ServiceDetail[],
  invoices: [] as Invoice[],

  catalog: [
    { catalogId: 1, tenantId: TENANT_A, name: "Mano de obra", type: "labor", price: 15000 },
    { catalogId: 2, tenantId: TENANT_A, name: "Cambio de aceite", type: "labor", price: 12000 },
  ] as CatalogItem[],

  seq: {
    budget: 0,
    budgetDetail: 0,
    service: 0,
    serviceDetail: 0,
    invoice: 0,
    catalog: 2,
  },

  refreshTokens: new Set<string>(),
};

export function nextBudgetNumber() {
  db.seq.budget += 1;
  return { id: db.seq.budget, number: `P-${String(db.seq.budget).padStart(4, "0")}` };
}

export function nextInvoiceNumber() {
  db.seq.invoice += 1;
  return { id: db.seq.invoice, number: `F-${String(db.seq.invoice).padStart(4, "0")}` };
}
