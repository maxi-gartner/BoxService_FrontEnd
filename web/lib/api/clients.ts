import { api } from "./client";
import type { Client, ClientCreateRequest, PortalInvite, Vehicle } from "@/types/entities";

export const clientsApi = {
  list: () => api.get<Client[]>("clients"),
  getById: (id: number) => api.get<Client>(`clients/${id}`),
  getVehicles: (id: number) => api.get<Vehicle[]>(`clients/${id}/vehicles`),
  create: (data: ClientCreateRequest) => api.post<Client>("clients", data),
  invitePortal: (id: number) => api.post<PortalInvite>(`clients/${id}/portal-invite`),
};
