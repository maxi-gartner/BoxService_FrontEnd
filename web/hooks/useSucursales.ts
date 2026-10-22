import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sucursalesApi } from "@/lib/api/sucursales";
import type { SucursalCreateRequest, SucursalUpdateRequest } from "@/types/entities";

export function useSucursales() {
  return useQuery({ queryKey: ["sucursales"], queryFn: sucursalesApi.list, staleTime: 60_000 });
}

export function useCreateSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SucursalCreateRequest) => sucursalesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sucursales"] }),
  });
}

export function useUpdateSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SucursalUpdateRequest }) => sucursalesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sucursales"] }),
  });
}
