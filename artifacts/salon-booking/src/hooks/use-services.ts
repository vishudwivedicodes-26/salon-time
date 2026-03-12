import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSalonServices,
  useCreateService as useGeneratedCreateService,
  getGetSalonServicesQueryKey
} from "@workspace/api-client-react";

export function useServices(salonId: number) {
  return useGetSalonServices(salonId, { query: { enabled: !!salonId } });
}

export function useCreateService(salonId: number) {
  const queryClient = useQueryClient();
  return useGeneratedCreateService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSalonServicesQueryKey(salonId) });
      }
    }
  });
}
