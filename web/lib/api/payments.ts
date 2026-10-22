import { api } from "./client";
import type { TenantPaymentStatus } from "@/types/entities";

export const paymentsApi = {
  // superadmin: de un vistazo, qué talleres pagaron el mes actual.
  overview: () => api.get<TenantPaymentStatus[]>("admin/payments"),
};
