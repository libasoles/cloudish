import { useCallback } from "react";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEdgeArrowDirection,
  setEdgeArrowDirection,
  getEdgeLineMode,
  setEdgeLineMode,
  type EdgeArrowDirection,
  type EdgeLineMode,
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

  const onLineModeChange = useCallback(
    (mode: EdgeLineMode) => {
      setEdges((edges) =>
        updateSyncedEdgeGroup(edge.id, edges, (e) => setEdgeLineMode(e, mode)),
      );
    },
    [setEdges, edge.id],
  );

  const direction = getEdgeArrowDirection(edge);
  const hasSourceArrow = direction === "source" || direction === "both";
  const hasTargetArrow = direction === "target" || direction === "both";
  const lineMode = getEdgeLineMode(edge);

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
      <div className="grid gap-2 text-sm font-medium text-foreground">
        <span>{t.lineStyle}</span>
        <div className="flex gap-2">
          <HoverOnlyTooltip content={t.solidLineToggle} side="top">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.solidLineToggle}
              aria-pressed={lineMode === "solid"}
              className={cn(
                "h-10 w-10",
                lineMode === "solid" &&
                  "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_hsl(var(--primary))] hover:text-primary",
              )}
              onClick={() => onLineModeChange("solid")}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <line
                  x1="2"
                  y1="10"
                  x2="18"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </HoverOnlyTooltip>
          <HoverOnlyTooltip content={t.dashedLineToggle} side="top">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.dashedLineToggle}
              aria-pressed={lineMode === "dashed"}
              className={cn(
                "h-10 w-10",
                lineMode === "dashed" &&
                  "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_hsl(var(--primary))] hover:text-primary",
              )}
              onClick={() => onLineModeChange("dashed")}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <line
                  x1="2"
                  y1="10"
                  x2="18"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
              </svg>
            </Button>
          </HoverOnlyTooltip>
          <HoverOnlyTooltip content={t.animatedToggle} side="top">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t.animatedToggle}
              aria-pressed={lineMode === "animated"}
              className={cn(
                "h-10 w-10",
                lineMode === "animated" &&
                  "border-primary bg-primary/20 text-primary shadow-[0_0_0_1px_hsl(var(--primary))] hover:text-primary",
              )}
              onClick={() => onLineModeChange("animated")}
            >
              <Play className="h-5 w-5" aria-hidden="true" />
            </Button>
          </HoverOnlyTooltip>
        </div>
      </div>
    </div>
  );
}
