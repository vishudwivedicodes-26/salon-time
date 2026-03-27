import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSalonServices,
  useCreateService as useGeneratedCreateService,
  getGetSalonServicesQueryKey,
} from "../../../../lib/api-client-react/src/index";

export function useServices(salonId: number) {
  return useGetSalonServices(salonId, { query: { enabled: !!salonId } });
}

export function useCreateService(salonId: number) {
  const queryClient = useQueryClient();
  return useGeneratedCreateService({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSalonServicesQueryKey(salonId) });
      },
    },
  });
}
