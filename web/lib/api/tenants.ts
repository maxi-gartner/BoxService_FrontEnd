import { api } from "./client";
import type { Sucursal, Tenant, TenantCreateRequest, TenantCreateResult, UserCreateRequest } from "@/types/entities";

export const tenantsApi = {
  list: () => api.get<Tenant[]>("tenants"),
  create: (data: TenantCreateRequest) => api.post<TenantCreateResult>("tenants", data),
  setActive: (id: number, active: boolean) => api.patch<{ message: string }>(`tenants/${id}`, { active }),
  createUser: (id: number, data: UserCreateRequest) =>
    api.post<{ userId: number; username: string; name: string; role: string }>(`tenants/${id}/users`, data),
  listSucursales: (id: number) => api.get<Sucursal[]>(`tenants/${id}/sucursales`),
};
