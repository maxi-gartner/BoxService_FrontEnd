import { api } from "./client";
import type {
  Service,
  ServiceCreateRequest,
  ServiceDetail,
  ServiceDetailCreateRequest,
} from "@/types/entities";

export const servicesApi = {
  list: () => api.get<Service[]>("services"),
  getById: (id: number) => api.get<Service>(`services/${id}`),
  getDetails: (id: number) => api.get<ServiceDetail[]>(`services/${id}/details`),
  create: (data: ServiceCreateRequest) => api.post<Service>("services", data),
  createDetail: (serviceId: number, data: ServiceDetailCreateRequest) =>
    api.post<ServiceDetail>(`services/${serviceId}/details`, data),
};
