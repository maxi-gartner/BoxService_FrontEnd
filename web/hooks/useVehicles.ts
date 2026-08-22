import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api/vehicles";

export function useVehicles() {
  return useQuery({ queryKey: ["vehicles"], queryFn: vehiclesApi.list });
}

export function useVehicleHistory(vehicleId: number | null) {
  return useQuery({
    queryKey: ["vehicles", vehicleId, "history"],
    queryFn: () => vehiclesApi.getHistory(vehicleId as number),
    enabled: vehicleId !== null,
  });
}
