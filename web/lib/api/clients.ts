import { api, buildQuery } from "./client";
import type { Client, ClientCreateRequest, PagedResult, PortalInvite, Vehicle } from "@/types/entities";

export const clientsApi = {
  list: (params: { page?: number; pageSize?: number; search?: string } = {}) =>
    api.get<PagedResult<Client>>(`clients${buildQuery(params)}`),
  getById: (id: number) => api.get<Client>(`clients/${id}`),
  getVehicles: (id: number) => api.get<Vehicle[]>(`clients/${id}/vehicles`),
  create: (data: ClientCreateRequest) => api.post<Client>("clients", data),
  invitePortal: (id: number) => api.post<PortalInvite>(`clients/${id}/portal-invite`),
};
