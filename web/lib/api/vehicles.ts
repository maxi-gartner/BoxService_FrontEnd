import { api } from "./client";
import type { Service, Vehicle, VehicleCreateRequest } from "@/types/entities";

export const vehiclesApi = {
  list: () => api.get<Vehicle[]>("vehicles"),
  getById: (id: number) => api.get<Vehicle>(`vehicles/${id}`),
  findByPlate: (plate: string) => api.get<Vehicle>(`vehicles?plate=${encodeURIComponent(plate)}`),
  getHistory: (id: number) => api.get<Service[]>(`vehicles/${id}/history`),
  create: (data: VehicleCreateRequest) => api.post<Vehicle>("vehicles", data),
};
