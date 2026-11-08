import { useQuery } from "@tanstack/react-query";
import { vehicleCatalogApi } from "@/lib/api/vehicleCatalog";

export function useVehicleBrands() {
  return useQuery({ queryKey: ["vehicle-catalog", "brands"], queryFn: vehicleCatalogApi.brands, staleTime: 60 * 60_000 });
}

export function useVehicleModels(brandId: string | null) {
  return useQuery({
    queryKey: ["vehicle-catalog", "models", brandId],
    queryFn: () => vehicleCatalogApi.models(brandId as string),
    enabled: !!brandId,
    staleTime: 60 * 60_000,
  });
}

export function useVehicleVersions(brandId: string | null, modelId: string | null) {
  return useQuery({
    queryKey: ["vehicle-catalog", "versions", brandId, modelId],
    queryFn: () => vehicleCatalogApi.versions(brandId as string, modelId as string),
    enabled: !!brandId && !!modelId,
    staleTime: 60 * 60_000,
  });
}
