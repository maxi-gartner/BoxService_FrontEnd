import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "@/lib/api/metrics";

export function useMetrics() {
  return useQuery({ queryKey: ["metrics"], queryFn: metricsApi.get, staleTime: 60_000 });
}
