import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api/vehicles";
import type { VehicleCreateRequest } from "@/types/entities";

export function useVehicles() {
  return useQuery({ queryKey: ["vehicles"], queryFn: vehiclesApi.list });
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
