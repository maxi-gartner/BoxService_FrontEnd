import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api/catalog";
import type { CatalogItemCreateRequest, CatalogItemUpdateRequest } from "@/types/entities";

export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: catalogApi.list });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CatalogItemCreateRequest) => catalogApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CatalogItemUpdateRequest }) => catalogApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => catalogApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });
}
