import { api } from "./client";
import type {
  Service,
  ServiceCreateRequest,
  ServiceDetail,
  ServiceDetailCreateRequest,
  ServiceInspection,
  ServiceInspectionPhoto,
  ServiceInspectionUpsertRequest,
  InspectionPhotoUrl,
} from "@/types/entities";

export const servicesApi = {
  list: () => api.get<Service[]>("services"),
  getById: (id: number) => api.get<Service>(`services/${id}`),
  getDetails: (id: number) => api.get<ServiceDetail[]>(`services/${id}/details`),
  create: (data: ServiceCreateRequest) => api.post<Service>("services", data),
  createDetail: (serviceId: number, data: ServiceDetailCreateRequest) =>
    api.post<ServiceDetail>(`services/${serviceId}/details`, data),
  getInspection: (serviceId: number) =>
    api.get<ServiceInspection>(`services/${serviceId}/inspection`),
  createInspection: (serviceId: number, data: ServiceInspectionUpsertRequest) =>
    api.post<ServiceInspection>(`services/${serviceId}/inspection`, data),
  updateInspection: (serviceId: number, data: ServiceInspectionUpsertRequest) =>
    api.patch<ServiceInspection>(`services/${serviceId}/inspection`, data),
  uploadInspectionPhoto: (
    serviceId: number,
    file: File,
    photoType: string,
    description: string,
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("photoType", photoType);
    form.append("description", description);
    return api.postForm<ServiceInspectionPhoto>(`services/${serviceId}/inspection/photos`, form);
  },
  getInspectionPhotoUrl: (serviceId: number, photoId: number) =>
    api.get<InspectionPhotoUrl>(`services/${serviceId}/inspection/photos/${photoId}/url`),
  deleteInspectionPhoto: (serviceId: number, photoId: number) =>
    api.delete<void>(`services/${serviceId}/inspection/photos/${photoId}`),
};
