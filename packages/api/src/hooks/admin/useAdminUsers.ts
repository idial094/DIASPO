import { useQuery } from "@tanstack/react-query";
import { getAdminUsers, type AdminUserItem } from "../../client";

export function useAdminUsers() {
  const query = useQuery<AdminUserItem[]>({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? "Impossible de charger les utilisateurs admin." : null
  };
}
