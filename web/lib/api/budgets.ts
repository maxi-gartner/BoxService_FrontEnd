import { api, buildQuery } from "./client";
import type { Budget, BudgetCreateRequest, BudgetDetailRequest, BudgetStatus, BudgetWithDetails, PagedResult } from "@/types/entities";

export const budgetsApi = {
  list: (params: { page?: number; pageSize?: number; status?: "todos" | "pendientes" } = {}) =>
    api.get<PagedResult<Budget>>(`budgets${buildQuery(params)}`),
  // Sin paginar — todos los presupuestos de un vehículo puntual (lo usa
  // BudgetsList en el Taller en vez de pedir el listado global).
  listByVehicle: (vehicleId: number) => api.get<Budget[]>(`budgets${buildQuery({ vehicleId })}`),
  getById: (id: number) => api.get<BudgetWithDetails>(`budgets/${id}`),
  create: (data: BudgetCreateRequest) => api.post<Budget>("budgets", data),
  updateStatus: (id: number, status: BudgetStatus) =>
    api.patch<{ budgetId: number; status: BudgetStatus; message?: string }>(`budgets/${id}`, { status }),
  assignService: (budgetId: number, serviceId: number) =>
    api.put<{ message: string }>(`budgets/${budgetId}/service`, { serviceId }),
  // Reemplaza los ítems de un presupuesto no finalizado (draft/sent/
  // approved) — permite sumar o sacar algo de último momento sin tener
  // que cancelar el presupuesto y armar uno nuevo.
  updateDetails: (id: number, details: BudgetDetailRequest[]) =>
    api.put<BudgetWithDetails>(`budgets/${id}/details`, { details }),
};
