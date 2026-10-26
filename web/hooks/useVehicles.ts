import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api/vehicles";
import type { VehicleCreateRequest } from "@/types/entities";

export function useVehicles(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({ queryKey: ["vehicles", params], queryFn: () => vehiclesApi.list(params) });
}

export function useVehicleById(id: number | null) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => vehiclesApi.getById(id as number),
    enabled: id !== null,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleCreateRequest) => vehiclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useVehicleHistory(vehicleId: number | null) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "history"],
    queryFn: () => vehiclesApi.getHistory(vehicleId as number),
    enabled: vehicleId !== null,
  });
}
