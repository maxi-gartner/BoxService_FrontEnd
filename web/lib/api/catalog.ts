import { api } from "./client";
import type { CatalogItem, CatalogItemCreateRequest, CatalogItemUpdateRequest } from "@/types/entities";

export const catalogApi = {
  list: () => api.get<CatalogItem[]>("catalog"),
  create: (data: CatalogItemCreateRequest) => api.post<CatalogItem>("catalog", data),
  update: (id: number, data: CatalogItemUpdateRequest) =>
    api.patch<{ message: string }>(`catalog/${id}`, data),
  remove: (id: number) => api.delete<{ message: string }>(`catalog/${id}`),
};
