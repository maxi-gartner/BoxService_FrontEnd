import { api } from "./client";
import type { Budget, BudgetCreateRequest, BudgetStatus, BudgetWithDetails } from "@/types/entities";

export const budgetsApi = {
  list: () => api.get<Budget[]>("budgets"),
  getById: (id: number) => api.get<BudgetWithDetails>(`budgets/${id}`),
  create: (data: BudgetCreateRequest) => api.post<Budget>("budgets", data),
  updateStatus: (id: number, status: BudgetStatus) =>
    api.patch<{ budgetId: number; status: BudgetStatus; message?: string }>(`budgets/${id}`, { status }),
  assignService: (budgetId: number, serviceId: number) =>
    api.put<{ message: string }>(`budgets/${budgetId}/service`, { serviceId }),
};
