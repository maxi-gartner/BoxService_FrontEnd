import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api/clients";
import type { ClientCreateRequest } from "@/types/entities";

export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: clientsApi.list });
}

export function useClientVehicles(clientId: number | null) {
  return useQuery({
    queryKey: ["clients", clientId, "vehicles"],
    queryFn: () => clientsApi.getVehicles(clientId as number),
    enabled: clientId !== null,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientCreateRequest) => clientsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}
