import { api } from "./client";
import type { Sucursal, SucursalCreateRequest, SucursalUpdateRequest } from "@/types/entities";

export const sucursalesApi = {
  list: () => api.get<Sucursal[]>("sucursales"),
  create: (data: SucursalCreateRequest) => api.post<Sucursal>("sucursales", data),
  update: (id: number, data: SucursalUpdateRequest) => api.patch<Sucursal>(`sucursales/${id}`, data),
};
