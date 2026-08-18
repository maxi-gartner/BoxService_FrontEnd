import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "@/lib/api/budgets";
import type { BudgetCreateRequest, BudgetStatus } from "@/types/entities";

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: budgetsApi.list });
}

export function useBudget(id: number | null) {
  return useQuery({
    queryKey: ["budgets", id],
    queryFn: () => budgetsApi.getById(id as number),
    enabled: id !== null,
  });
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (data: BudgetCreateRequest) => budgetsApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateBudgetStatus() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BudgetStatus }) => budgetsApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useAssignServiceToBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ budgetId, serviceId }: { budgetId: number; serviceId: number }) =>
      budgetsApi.assignService(budgetId, serviceId),
    onSuccess: invalidate,
  });
}
