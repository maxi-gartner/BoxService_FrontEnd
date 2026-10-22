import { api } from "./client";
import type { VehicleCatalogOption } from "@/types/entities";

export const vehicleCatalogApi = {
  brands: () => api.get<VehicleCatalogOption[]>("vehicle-catalog/brands"),
  models: (brandId: string) => api.get<VehicleCatalogOption[]>(`vehicle-catalog/models?brandId=${brandId}`),
  versions: (brandId: string, modelId: string) =>
    api.get<VehicleCatalogOption[]>(`vehicle-catalog/versions?brandId=${brandId}&modelId=${modelId}`),
};
