import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUserArchitectures,
  saveUserArchitecture,
  type SavedArchitecture,
} from "@/lib/architectures";
import { useAuth } from "@/hooks/useAuth";

export const ARCHITECTURES_QUERY_KEY = "architectures";

export function useArchitectures() {
  const { user } = useAuth();
  return useQuery<SavedArchitecture[]>({
    queryKey: [ARCHITECTURES_QUERY_KEY, user?.uid],
    queryFn: () => listUserArchitectures().then((res) => res.architectures),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });
}

export function useSaveArchitecture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveUserArchitecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARCHITECTURES_QUERY_KEY] });
    },
  });
}
