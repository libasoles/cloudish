import { FolderOpen, Loader2 } from "lucide-react";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { useArchitectures } from "@/hooks/useArchitectures";

type Props = {
  onSelect?: () => void;
};

export function SavedProjectsList({ onSelect }: Props = {}) {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as (typeof UI_TEXT)["en"];
  const { loadArchitecture } = useFlowStore();

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

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {t.savedProjects}
      </p>
      {projects.map((project) => (
        <button
          key={project.architectureId}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-accent"
          onClick={() => {
            loadArchitecture(project.nodes, project.edges);
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
    </div>
  );
}
