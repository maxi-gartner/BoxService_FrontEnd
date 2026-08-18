import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api/invoices";
import type { InvoiceCreateRequest, InvoiceStatus } from "@/types/entities";

export function useInvoices() {
  return useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceCreateRequest) => invoicesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: InvoiceStatus }) => invoicesApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
