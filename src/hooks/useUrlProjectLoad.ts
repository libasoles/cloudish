import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useFlowStore } from "@/store/flowStore";
import { getArchitecture } from "@/lib/architectures";
import {
  clearUrlArchitectureId,
  getUrlArchitectureId,
} from "@/lib/url-utils";

export function useUrlProjectLoad() {
  const { user, loading: authLoading } = useAuth();
  const { loadArchitecture } = useFlowStore();

  const [urlArchitectureId] = useState(getUrlArchitectureId);
  const [initialized, setInitialized] = useState(!urlArchitectureId);

  const { data, isError } = useQuery({
    queryKey: ["urlArchitecture", urlArchitectureId],
    queryFn: () => getArchitecture(urlArchitectureId!),
    enabled: !initialized && !authLoading && !!user && !!urlArchitectureId,
    retry: false,
    staleTime: Infinity,
  });

  // Auth resolved but user is not logged in — clear URL and stop.
  useEffect(() => {
    if (initialized || authLoading || !urlArchitectureId || user) {
      return;
    }

    clearUrlArchitectureId();
    queueMicrotask(() => setInitialized(true));
  }, [authLoading, initialized, urlArchitectureId, user]);

  // Architecture fetched successfully — load it into the canvas.
  useEffect(() => {
    if (!data || initialized) return;

    loadArchitecture(data.nodes, data.edges, {
      architectureId: data.architectureId,
      name: data.name,
      viewport: data.viewport ?? null,
    });
    queueMicrotask(() => setInitialized(true));
  }, [data, initialized, loadArchitecture]);

  // Fetch failed (404, 403, network) — clear URL and show empty canvas.
  useEffect(() => {
    if (!isError || initialized) return;

    clearUrlArchitectureId();
    queueMicrotask(() => setInitialized(true));
  }, [initialized, isError]);
}
