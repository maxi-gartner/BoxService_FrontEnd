import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workOrdersApi } from "@/lib/api/workOrders";
import type { WorkOrderStatus } from "@/types/entities";

export function useOpenWorkOrders(enabled = true) {
  return useQuery({
    queryKey: ["work-orders"],
    queryFn: () => workOrdersApi.listOpen(),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useVehicleWorkOrder(vehicleId: number | null) {
  return useQuery({
    queryKey: ["work-orders", "vehicle", vehicleId],
    queryFn: () => workOrdersApi.getForVehicle(vehicleId!),
    enabled: vehicleId !== null,
  });
}

function useInvalidateWorkOrders() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["work-orders"] });
}

export function useReceiveVehicle() {
  const invalidate = useInvalidateWorkOrders();
  return useMutation({
    mutationFn: ({ vehicleId, notes }: { vehicleId: number; notes?: string }) =>
      workOrdersApi.receive(vehicleId, notes),
    onSuccess: invalidate,
  });
}

export function useAdvanceWorkOrder() {
  const invalidate = useInvalidateWorkOrders();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: WorkOrderStatus; notes?: string }) =>
      workOrdersApi.advance(id, status, notes),
    onSuccess: invalidate,
  });
}

export function useCancelWorkOrder() {
  const invalidate = useInvalidateWorkOrders();
  return useMutation({
    mutationFn: (id: number) => workOrdersApi.cancel(id),
    onSuccess: invalidate,
  });
}
