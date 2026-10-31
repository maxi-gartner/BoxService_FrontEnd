import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type ServiceReminder = {
  serviceId: number; vehicleId: number; clientId: number; clientName: string; phone: string;
  vehicle: string; plate: string; nextDate: string; daysRemaining: number;
  status: "upcoming" | "today" | "overdue";
  contactedAt: string | null; contactedBy: string | null; whatsappUrl: string | null;
};
type ReminderList = { items: ServiceReminder[]; pendingCount: number; today: string };

export function useServiceReminders(enabled = true) {
  return useQuery({
    queryKey: ["service-reminders"],
    queryFn: () => api.get<ReminderList>("service-reminders"),
    enabled, staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: true,
  });
}

export function useContactReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`service-reminders/${id}/contact`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["service-reminders"] }),
  });
}

export function useReminderPhone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, phone }: { id: number; phone: string }) =>
      api.patch(`service-reminders/clients/${id}/phone`, { phone }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["clients"] });
      return client.invalidateQueries({ queryKey: ["service-reminders"] });
    },
  });
}
