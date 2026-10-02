import { api } from "./client";
import type { Invoice, InvoiceCreateRequest, InvoiceStatus } from "@/types/entities";

export const invoicesApi = {
  list: () => api.get<Invoice[]>("invoices"),
  getById: (id: number) => api.get<Invoice>(`invoices/${id}`),
  create: (data: InvoiceCreateRequest) => api.post<Invoice>("invoices", data),
  updateStatus: (id: number, status: InvoiceStatus) =>
    api.patch<{ invoiceId: number; status: InvoiceStatus }>(`invoices/${id}`, { status }),
};
