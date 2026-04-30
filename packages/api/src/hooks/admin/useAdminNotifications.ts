import { useQuery } from "@tanstack/react-query";
import {
  getAdminNotifications,
  type AdminNotificationItem
} from "../../client";

export function useAdminNotifications() {
  const query = useQuery<AdminNotificationItem[]>({
    queryKey: ["admin-notifications"],
    queryFn: getAdminNotifications
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les notifications admin." : null
  };
}
