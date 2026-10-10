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

// Portal del cliente: invitación por WhatsApp para que el dueño del auto
// entre con Google a ver el estado de su vehículo (ver docs/PORTAL.md).
export type PortalInvite = {
  inviteUrl: string;
  whatsappUrl: string;
  expiresAt: string;
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

// Inspección de ingreso: documenta cómo llegó el vehículo para un service.
export type InspectionItemStatus = "ok" | "damaged" | "not_checked";

export type ServiceInspectionItem = {
  itemId: number;
  itemCode: string;
  itemName: string;
  status: InspectionItemStatus;
  observation: string;
};

export type ServiceInspectionPhoto = {
  photoId: number;
  storagePath: string;
  photoType: string;
  description: string;
  originalFileName: string;
  contentType: string;
  createdAt: string;
};

export type ServiceInspection = {
  inspectionId: number;
  serviceId: number;
  fuelLevel: number | null;
  generalObservations: string;
  inspectedBy: string;
  inspectedAt: string;
  items: ServiceInspectionItem[];
  photos: ServiceInspectionPhoto[];
};

export type ServiceInspectionItemRequest = {
  itemCode: string;
  status: InspectionItemStatus;
  observation: string | null;
};

export type ServiceInspectionUpsertRequest = {
  fuelLevel: number | null;
  generalObservations: string | null;
  items: ServiceInspectionItemRequest[];
};

export type InspectionPhotoUrl = {
  url: string;
  expiresIn: number;
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
