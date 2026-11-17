import { api } from "./client";
import type { WorkOrder, WorkOrderRow, WorkOrderStatus } from "@/types/entities";

export const workOrdersApi = {
  listOpen: () => api.get<WorkOrderRow[]>("work-orders"),
  getForVehicle: (vehicleId: number) => api.get<WorkOrder>(`vehicles/${vehicleId}/work-order`),
  receive: (vehicleId: number, notes?: string) =>
    api.post<{ orderId: number; status: WorkOrderStatus }>(`vehicles/${vehicleId}/work-orders`, { notes }),
  advance: (id: number, status: WorkOrderStatus, notes?: string) =>
    api.patch<{ orderId: number; status: WorkOrderStatus }>(`work-orders/${id}/status`, { status, notes }),
  cancel: (id: number) => api.delete<{ cancelled: boolean }>(`work-orders/${id}`),
};
