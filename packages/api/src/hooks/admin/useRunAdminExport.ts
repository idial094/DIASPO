import { useMutation } from "@tanstack/react-query";
import { runAdminExport } from "../../client";

export function useRunAdminExport() {
  const mutation = useMutation({
    mutationFn: (id: string) => runAdminExport(id)
  });

  return {
    runExport: mutation.mutateAsync,
    isPending: mutation.isPending
  };
}
