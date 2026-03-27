import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSalons,
  useGetSalon,
  useCreateSalon as useGeneratedCreateSalon,
  useSalonLogin as useGeneratedSalonLogin,
  getGetSalonsQueryKey
} from "../../../../lib/api-client-react/src/index";

const AUTH_KEY = "salon_owner_auth";

export interface SalonAuth {
  salonId: number;
  salonName: string;
}

export function getSalonAuth(): SalonAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SalonAuth;
  } catch {
    return null;
  }
}

export function setSalonAuth(auth: SalonAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearSalonAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthorizedForSalon(salonId: number): boolean {
  const auth = getSalonAuth();
  return auth?.salonId === salonId;
}

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

export function useSalonLogin() {
  return useGeneratedSalonLogin();
}
