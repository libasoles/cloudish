import { useState } from "react";
import { FolderOpen, Loader2, ChevronDown } from "lucide-react";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { useArchitectures } from "@/hooks/useArchitectures";
import { setUrlArchitectureId } from "@/lib/url-utils";

const PAGE_SIZE = 5;

type Props = {
  onSelect?: () => void;
};

export function SavedProjectsList({ onSelect }: Props = {}) {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as (typeof UI_TEXT)["en"];
  const { loadArchitecture } = useFlowStore();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: projects, isLoading, isError } = useArchitectures();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="pt-4 text-center text-xs text-muted-foreground">
        {t.savedProjectsError}
      </p>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <p className="pt-4 text-center text-xs text-muted-foreground">
        {t.savedProjectsEmpty}
      </p>
    );
  }

  const visibleProjects = projects.slice(0, visibleCount);
  const hasMore = visibleCount < projects.length;

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {t.savedProjects}
      </p>
      {visibleProjects.map((project) => (
        <button
          key={project.architectureId}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-accent"
          onClick={() => {
            loadArchitecture(project.nodes, project.edges, {
              architectureId: project.architectureId,
              name: project.name,
              viewport: project.viewport ?? null,
            });
            setUrlArchitectureId(project.architectureId);
            onSelect?.();
          }}
        >
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{project.name}</p>
            {project.updatedAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </button>
      ))}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          Ver más
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
