import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";

export function useAdminClients() {
  return useQuery({ queryKey: ["admin", "clients"], queryFn: adminApi.listClients, staleTime: 60_000 });
}
