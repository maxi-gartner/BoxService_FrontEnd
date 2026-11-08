import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api/invoices";
import type { InvoiceCreateRequest, InvoiceStatus } from "@/types/entities";

// Mismo criterio que useBudgets/useServices: cobrar una factura desde otro
// puesto tiene que verse rápido acá.
export function useInvoices(params: { page?: number; pageSize?: number; status?: "todas" | "por-cobrar" } = {}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.list(params),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

// Tarjetas de resumen de FacturasPage — agregados server-side, no
// dependen de qué página/filtro esté mirando el usuario.
export function useInvoiceStats() {
  return useQuery({
    queryKey: ["invoices", "stats"],
    queryFn: invoicesApi.getStats,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

// Facturas de un vehículo puntual (Taller) — sin paginar, un vehículo
// nunca acumula miles de facturas propias.
export function useInvoicesByVehicle(vehicleId: number | null) {
  return useQuery({
    queryKey: ["invoices", "byVehicle", vehicleId],
    queryFn: () => invoicesApi.listByVehicle(vehicleId as number),
    enabled: vehicleId !== null,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
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
