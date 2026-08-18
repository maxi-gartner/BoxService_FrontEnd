/**
 * Entidades de dominio. Mismos nombres de campo que ya usaba el backend
 * actual (camelCase) — se mantiene continuidad, no se rediseña el
 * contrato de datos sin necesidad. Se agrega `tenantId` donde corresponde
 * porque ahora todo vive dentro de un tenant (taller).
 */

export type Tenant = {
  tenantId: string;
  name: string;
  createdAt: string;
};

// ── Clientes ──────────────────────────────────────────
export type Client = {
  clientId: number;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type ClientCreateRequest = {
  name: string;
  phone?: string;
  email?: string;
};

// ── Vehículos ─────────────────────────────────────────
export type Vehicle = {
  vehicleId: number;
  tenantId: string;
  clientId: number;
  brand: string;
  model: string;
  year: number | null;
  plate: string;
  currentMileage: number;
  createdAt: string;
};

export type VehicleCreateRequest = {
  clientId: number;
  brand: string;
  model: string;
  year?: number | null;
  plate: string;
  currentMileage?: number;
};

// ── Presupuestos ──────────────────────────────────────
export type BudgetStatus = "draft" | "sent" | "approved" | "completed" | "rejected";

export type BudgetDetail = {
  detailId: number;
  budgetId: number;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Budget = {
  budgetId: number;
  tenantId: string;
  number: string; // P-0001
  date: string;
  status: BudgetStatus;
  notes: string | null;
  vehicleId: number;
  serviceId: number | null;
};

export type BudgetWithDetails = {
  budget: Budget;
  details: BudgetDetail[];
  total: number;
};

export type BudgetDetailRequest = {
  type: "labor" | "part";
  description: string;
  quantity: number;
  unitPrice: number;
};

export type BudgetCreateRequest = {
  vehicleId: number;
  notes?: string | null;
  details: BudgetDetailRequest[];
};

export type BudgetStatusRequest = {
  status: BudgetStatus;
};

// ── Services ──────────────────────────────────────────
export type ServiceDetail = {
  detailId: number;
  serviceId: number;
  description: string;
  done: boolean;
};

export type Service = {
  serviceId: number;
  tenantId: string;
  vehicleId: number;
  date: string;
  mileage: number;
  serviceType: string;
  notes: string;
  nextMileage: number | null;
  nextDate: string | null;
};

export type ServiceCreateRequest = {
  vehicleId: number;
  date: string;
  mileage: number;
  serviceType: string;
  notes?: string;
};

export type ServiceDetailCreateRequest = {
  description: string;
  done: boolean;
};

// ── Facturas ──────────────────────────────────────────
export type InvoiceStatus = "issued" | "paid" | "cancelled";

export type Invoice = {
  invoiceId: number;
  tenantId: string;
  number: string; // F-0001
  date: string;
  total: number;
  status: InvoiceStatus;
  serviceId: number;
  budgetId: number | null;
};

export type InvoiceCreateRequest = {
  serviceId: number;
  budgetId?: number | null;
};

export type InvoiceStatusRequest = {
  status: InvoiceStatus;
};

// ── Catálogo de precios ───────────────────────────────
export type CatalogItem = {
  catalogId: number;
  tenantId: string;
  name: string;
  type: "labor" | "part";
  price: number;
};

export type CatalogItemCreateRequest = {
  name: string;
  type: "labor" | "part";
  price: number;
};

export type CatalogItemUpdateRequest = Partial<CatalogItemCreateRequest>;
