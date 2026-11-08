import { api } from "./client";
import type { TenantMetrics } from "@/types/entities";

export const metricsApi = {
  get: () => api.get<TenantMetrics>("metrics"),
};
