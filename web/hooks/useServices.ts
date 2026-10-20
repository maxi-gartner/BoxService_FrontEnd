import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/lib/api/services";
import type {
  ServiceCreateRequest,
  ServiceDetailCreateRequest,
  ServiceInspectionUpsertRequest,
} from "@/types/entities";

// Mismo criterio que useBudgets: el trabajo en el taller cambia en vivo
// entre puestos, vale la pena refetchear al volver a la pestaña.
export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: servicesApi.list,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
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

export function useServiceInspection(serviceId: number | null) {
  return useQuery({
    queryKey: ["services", serviceId, "inspection"],
    queryFn: () => servicesApi.getInspection(serviceId!),
    enabled: serviceId !== null,
    retry: false,
  });
}

export function useSaveServiceInspection(serviceId: number, exists: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceInspectionUpsertRequest) =>
      exists
        ? servicesApi.updateInspection(serviceId, data)
        : servicesApi.createInspection(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", serviceId, "inspection"] });
    },
  });
}

export function useUploadInspectionPhoto(serviceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, photoType, description }: { file: File; photoType: string; description: string }) =>
      servicesApi.uploadInspectionPhoto(serviceId, file, photoType, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", serviceId, "inspection"] });
    },
  });
}

export function useDeleteInspectionPhoto(serviceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) => servicesApi.deleteInspectionPhoto(serviceId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", serviceId, "inspection"] });
    },
  });
}
