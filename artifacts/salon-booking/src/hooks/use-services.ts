```typescript
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "../../../../lib/api-client-react/src/index";

export function useServices(salonId: number) {
  return useGetServices(salonId, { query: { enabled: !!salonId } });
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
