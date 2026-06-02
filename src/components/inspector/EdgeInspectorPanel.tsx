import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEdgeArrowDirection,
  type EdgeArrowDirection,
} from "@/lib/edge-tools";
import { cn } from "@/lib/utils";
import type { UI_TEXT } from "@/i18n";
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
  onLabelChange: (label: string) => void;
  onArrowDirectionChange: (direction: EdgeArrowDirection) => void;
  t: typeof UI_TEXT["en"];
};

export function EdgeInspectorPanel({
  edge,
  onLabelChange,
  onArrowDirectionChange,
  t,
}: EdgeInspectorPanelProps) {
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t.sourceArrowToggle}
            aria-pressed={hasSourceArrow}
            title={t.sourceArrowToggle}
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t.targetArrowToggle}
            aria-pressed={hasTargetArrow}
            title={t.targetArrowToggle}
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
        </div>
      </div>
    </div>
  );
}
