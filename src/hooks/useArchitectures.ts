import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listUserArchitectures,
  saveUserArchitecture,
  type SavedArchitecture,
} from "@/lib/architectures";
import { useAuth } from "@/hooks/useAuth";

export const ARCHITECTURES_QUERY_KEY = "architectures";

function getArchitecturesQueryKey(userId: string | undefined) {
  return [ARCHITECTURES_QUERY_KEY, userId] as const;
}

async function listArchitectures() {
  const res = await listUserArchitectures();
  return res.architectures;
}

export function useArchitectures() {
  const { user } = useAuth();
  return useQuery<SavedArchitecture[]>({
    queryKey: getArchitecturesQueryKey(user?.uid),
    queryFn: listArchitectures,
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });
}

export function useSaveArchitecture() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveUserArchitecture,
    onSuccess: async () => {
      const queryKey = getArchitecturesQueryKey(user?.uid);

      await queryClient.invalidateQueries({ queryKey });

      if (!user) return;

      await queryClient.prefetchQuery({
        queryKey,
        queryFn: listArchitectures,
        staleTime: 5 * 60 * 1000,
      });
    },
  });
}
