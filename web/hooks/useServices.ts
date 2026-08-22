import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/lib/api/services";
import type { ServiceCreateRequest, ServiceDetailCreateRequest } from "@/types/entities";

export function useServices() {
  return useQuery({ queryKey: ["services"], queryFn: servicesApi.list });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceCreateRequest) => servicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useCreateServiceDetail() {
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: number; data: ServiceDetailCreateRequest }) =>
      servicesApi.createDetail(serviceId, data),
  });
}
