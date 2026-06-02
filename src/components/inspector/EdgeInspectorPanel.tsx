import { useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEdgeArrowDirection,
  setEdgeArrowDirection,
  type EdgeArrowDirection,
} from "@/lib/edge-tools";
import { cn } from "@/lib/utils";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { updateSyncedEdgeGroup } from "@/lib/az-sync";
import type { AppEdge } from "@/types/flow";

function getArrowDirectionFromToggles(
  hasSourceArrow: boolean,
  hasTargetArrow: boolean,
): EdgeArrowDirection {
  if (hasSourceArrow && hasTargetArrow) return "both";
  if (hasSourceArrow) return "source";
  if (hasTargetArrow) return "target";
  return "none";
}

type EdgeInspectorPanelProps = {
  edge: AppEdge;
};

export function EdgeInspectorPanel({ edge }: EdgeInspectorPanelProps) {
  const { setEdges } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const onLabelChange = useCallback(
    (label: string) => {
      setEdges((edges) =>
        updateSyncedEdgeGroup(edge.id, edges, (e) => ({ ...e, label })),
      );
    },
    [setEdges, edge.id],
  );

  const onArrowDirectionChange = useCallback(
    (direction: EdgeArrowDirection) => {
      setEdges((edges) =>
        updateSyncedEdgeGroup(edge.id, edges, (e) =>
          setEdgeArrowDirection(e, direction),
        ),
      );
    },
    [setEdges, edge.id],
  );

  const direction = getEdgeArrowDirection(edge);
  const hasSourceArrow = direction === "source" || direction === "both";
  const hasTargetArrow = direction === "target" || direction === "both";

  return (
    <div className="space-y-4 text-sm">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.label}
        <Input
          value={String(edge.label ?? "")}
          onChange={(event) => onLabelChange(event.target.value)}
        />
      </label>
      <div className="grid gap-2 text-sm font-medium text-foreground">
        <span>{t.arrows}</span>
        <div className="flex gap-2">
          <HoverOnlyTooltip content={t.sourceArrowToggle} side="top">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.sourceArrowToggle}
              aria-pressed={hasSourceArrow}
              className={cn(
                "h-10 w-10",
                hasSourceArrow &&
                  "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_hsl(var(--primary))] hover:text-primary",
              )}
              onClick={() =>
                onArrowDirectionChange(
                  getArrowDirectionFromToggles(!hasSourceArrow, hasTargetArrow),
                )
              }
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </HoverOnlyTooltip>
          <HoverOnlyTooltip content={t.targetArrowToggle} side="top">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.targetArrowToggle}
              aria-pressed={hasTargetArrow}
              className={cn(
                "h-10 w-10",
                hasTargetArrow &&
                  "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_hsl(var(--primary))] hover:text-primary",
              )}
              onClick={() =>
                onArrowDirectionChange(
                  getArrowDirectionFromToggles(hasSourceArrow, !hasTargetArrow),
                )
              }
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </HoverOnlyTooltip>
        </div>
      </div>
    </div>
  );
}
