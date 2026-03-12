import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSalons,
  useGetSalon,
  useCreateSalon as useGeneratedCreateSalon,
  getGetSalonsQueryKey
} from "@workspace/api-client-react";

export function useSalons() {
  return useGetSalons();
}

export function useSalon(id: number) {
  return useGetSalon(id, { query: { enabled: !!id } });
}

export function useCreateSalon() {
  const queryClient = useQueryClient();
  return useGeneratedCreateSalon({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSalonsQueryKey() });
      }
    }
  });
}
