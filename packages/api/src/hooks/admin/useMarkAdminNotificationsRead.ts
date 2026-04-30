import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markAdminNotificationRead,
  markAllAdminNotificationsRead
} from "../../client";

export function useMarkAdminNotificationsRead() {
  const queryClient = useQueryClient();

  const markOne = useMutation({
    mutationFn: (id: string) => markAdminNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    }
  });

  const markAll = useMutation({
    mutationFn: () => markAllAdminNotificationsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    }
  });

  return {
    markRead: markOne.mutateAsync,
    markAllRead: markAll.mutateAsync,
    isPending: markOne.isPending || markAll.isPending
  };
}
