import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantsApi } from "@/lib/api/tenants";
import type { TenantCreateRequest, TenantPaymentCreateRequest, TenantUpdateRequest, UserCreateRequest } from "@/types/entities";

export function useTenants() {
  return useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list, staleTime: 60_000 });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantCreateRequest) => tenantsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useSetTenantActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => tenantsApi.setActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useCreateTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: number; data: UserCreateRequest }) =>
      tenantsApi.createUser(tenantId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useTenantSucursales(tenantId: number | null) {
  return useQuery({
    queryKey: ["tenants", tenantId, "sucursales"],
    queryFn: () => tenantsApi.listSucursales(tenantId!),
    enabled: tenantId !== null,
  });
}

export function useUpdateTenantContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TenantUpdateRequest }) => tenantsApi.updateContact(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useTenantPayments(tenantId: number | null) {
  return useQuery({
    queryKey: ["tenants", tenantId, "payments"],
    queryFn: () => tenantsApi.getPayments(tenantId!),
    enabled: tenantId !== null,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: number; data: TenantPaymentCreateRequest }) =>
      tenantsApi.recordPayment(tenantId, data),
    onSuccess: (_, { tenantId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", tenantId, "payments"] });
    },
  });
}
