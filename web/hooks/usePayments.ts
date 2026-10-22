import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments";

export function usePaymentsOverview() {
  return useQuery({ queryKey: ["admin", "payments"], queryFn: paymentsApi.overview, staleTime: 30_000 });
}
