import { useQueryClient } from "@tanstack/react-query";
import {
  useGetBookings,
  useGetBooking,
  useGetAvailableSlots,
  useCreateBooking as useGeneratedCreateBooking,
  useUpdateBookingStatus as useGeneratedUpdateBookingStatus,
  getGetBookingsQueryKey,
  getGetBookingQueryKey,
  getGetAvailableSlotsQueryKey,
} from "@workspace/api-client-react";

export function useBookings(salonId?: number, date?: string) {
  return useGetBookings(
    { salonId, date },
    { query: { enabled: !!salonId, queryKey: getGetBookingsQueryKey({ salonId, date }) } }
  );
}

export function useBooking(id: number) {
  return useGetBooking(
    id,
    { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) } }
  );
}

export function useAvailableSlots(salonId: number, date: string, serviceId?: number) {
  return useGetAvailableSlots(
    salonId,
    { date, serviceId },
    { query: { enabled: !!salonId && !!date, queryKey: getGetAvailableSlotsQueryKey(salonId, { date, serviceId }) } }
  );
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useGeneratedCreateBooking({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
        if (data.salonId) {
          queryClient.invalidateQueries({ queryKey: getGetAvailableSlotsQueryKey(data.salonId) });
        }
      }
    }
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useGeneratedUpdateBookingStatus({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(data.id) });
      }
    }
  });
}
