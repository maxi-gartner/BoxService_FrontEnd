import { api, buildQuery } from "./client";
import type { Invoice, InvoiceCreateRequest, InvoiceStatus, PagedResult } from "@/types/entities";

export const invoicesApi = {
  list: (params: { page?: number; pageSize?: number; status?: "todas" | "por-cobrar" } = {}) =>
    api.get<PagedResult<Invoice>>(`invoices${buildQuery(params)}`),
  // Sin paginar — todas las facturas de un vehículo puntual (lo usa
  // InvoicingList en el Taller en vez de pedir el listado global).
  listByVehicle: (vehicleId: number) => api.get<Invoice[]>(`invoices${buildQuery({ vehicleId })}`),
  // Agregados para las tarjetas de resumen de FacturasPage — ver
  // backend InvoiceRepository.GetStats.
  getStats: () => api.get<{ totalCount: number; pendingCount: number; pendingTotal: number }>("invoices/stats"),
  getById: (id: number) => api.get<Invoice>(`invoices/${id}`),
  create: (data: InvoiceCreateRequest) => api.post<Invoice>("invoices", data),
  updateStatus: (id: number, status: InvoiceStatus) =>
    api.patch<{ invoiceId: number; status: InvoiceStatus }>(`invoices/${id}`, { status }),
};
