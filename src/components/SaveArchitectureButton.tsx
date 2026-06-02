import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SaveArchitectureButtonLabels = {
  saveArchitecture: string;
  saveArchitectureTooltip: string;
  saveArchitectureSaving: string;
  saveArchitectureSaved: string;
  saveArchitectureFailed: string;
};

type SaveArchitectureButtonProps = {
  labels: SaveArchitectureButtonLabels;
  disabled?: boolean;
  onSave: () => Promise<void>;
};

export default function SaveArchitectureButton({
  labels,
  disabled,
  onSave,
}: SaveArchitectureButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function handleSave() {
    setStatus("saving");

    try {
      await onSave();
      setStatus("saved");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  let tooltipText = labels.saveArchitectureTooltip;

  if (status === "saving") {
    tooltipText = labels.saveArchitectureSaving;
  }

  if (status === "saved") {
    tooltipText = labels.saveArchitectureSaved;
  }

  if (status === "error") {
    tooltipText = labels.saveArchitectureFailed;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled || status === "saving"}
          onClick={handleSave}
          aria-label={labels.saveArchitecture}
        >
          {status === "saving" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
