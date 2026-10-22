import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import type { ResetPasswordRequest, UserCreateRequest, UserUpdateRequest } from "@/types/entities";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: usersApi.list, staleTime: 60_000 });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateRequest) => usersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateRequest }) => usersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResetPasswordRequest }) => usersApi.resetPassword(id, data),
  });
}
