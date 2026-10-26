import { api, buildQuery } from "./client";
import type { PagedResult, Service, Vehicle, VehicleCreateRequest } from "@/types/entities";

export const vehiclesApi = {
  list: (params: { page?: number; pageSize?: number; search?: string } = {}) =>
    api.get<PagedResult<Vehicle>>(`vehicles${buildQuery(params)}`),
  getById: (id: number) => api.get<Vehicle>(`vehicles/${id}`),
  findByPlate: (plate: string) => api.get<Vehicle>(`vehicles?plate=${encodeURIComponent(plate)}`),
  getHistory: (id: number) => api.get<Service[]>(`vehicles/${id}/history`),
  create: (data: VehicleCreateRequest) => api.post<Vehicle>("vehicles", data),
};
