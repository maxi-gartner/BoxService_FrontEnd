import { api } from "./client";
import type { ResetPasswordRequest, UserAccount, UserCreateRequest, UserUpdateRequest } from "@/types/entities";

export const usersApi = {
  // dueno/empleado: solo los de su tenant. superadmin: todos, con tenantName.
  list: () => api.get<UserAccount[]>("users"),
  // Alta de empleado en el propio tenant (dueno). Para dar de alta en un
  // tenant puntual como superadmin, ver tenantsApi.createUser.
  create: (data: UserCreateRequest) => api.post<UserAccount>("users", data),
  update: (id: number, data: UserUpdateRequest) => api.patch<UserAccount>(`users/${id}`, data),
  resetPassword: (id: number, data: ResetPasswordRequest) =>
    api.post<{ message: string }>(`users/${id}/reset-password`, data),
};
