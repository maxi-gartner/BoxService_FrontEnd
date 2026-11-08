import { api } from "./client";
import type { AdminClientRow } from "@/types/entities";
import type { AuthAuditEvent } from "@/types/auth";

export const adminApi = {
  // superadmin: todos los clientes de todos los tenants, con el nombre
  // del tenant embebido. La contraparte cross-tenant de clientsApi.list.
  listClients: () => api.get<AdminClientRow[]>("admin/clients"),
  listAuthAudit: () => api.get<AuthAuditEvent[]>("admin/auth-audit?limit=200"),
};
