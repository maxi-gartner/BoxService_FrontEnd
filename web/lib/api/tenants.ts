import { api } from "./client";
import type {
  Sucursal,
  Tenant,
  TenantCreateRequest,
  TenantCreateResult,
  TenantPayment,
  TenantPaymentCreateRequest,
  TenantUpdateRequest,
  UserCreateRequest,
} from "@/types/entities";

export const tenantsApi = {
  list: () => api.get<Tenant[]>("tenants"),
  create: (data: TenantCreateRequest) => api.post<TenantCreateResult>("tenants", data),
  setActive: (id: number, active: boolean) => api.patch<{ message: string }>(`tenants/${id}`, { active }),
  updateContact: (id: number, data: TenantUpdateRequest) =>
    api.patch<{ message: string }>(`tenants/${id}`, data),
  createUser: (id: number, data: UserCreateRequest) =>
    api.post<{ userId: number; username: string; name: string; role: string }>(`tenants/${id}/users`, data),
  listSucursales: (id: number) => api.get<Sucursal[]>(`tenants/${id}/sucursales`),
  getPayments: (id: number) => api.get<TenantPayment[]>(`tenants/${id}/payments`),
  recordPayment: (id: number, data: TenantPaymentCreateRequest) =>
    api.post<TenantPayment>(`tenants/${id}/payments`, data),
};
