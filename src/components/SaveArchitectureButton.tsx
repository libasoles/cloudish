import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

type SaveArchitectureButtonLabels = {
  saveArchitecture: string;
  saveArchitectureTooltip: string;
  saveArchitectureSaving: string;
  saveArchitectureSaved: string;
  saveArchitectureSavedDescription: string;
  saveArchitectureFailed: string;
  saveArchitectureFailedDescription: string;
};

type SaveArchitectureButtonProps = {
  labels: SaveArchitectureButtonLabels;
  disabled?: boolean;
  isAuthenticated: boolean;
  onSave: () => Promise<void>;
  onAuthRequired: () => void;
};

export default function SaveArchitectureButton({
  labels,
  disabled,
  isAuthenticated,
  onSave,
  onAuthRequired,
}: SaveArchitectureButtonProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function handleSave() {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    setSaving(true);

    try {
      await onSave();
      toast({
        title: labels.saveArchitectureSaved,
        description: labels.saveArchitectureSavedDescription,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: labels.saveArchitectureFailed,
        description: labels.saveArchitectureFailedDescription,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  let tooltipText = labels.saveArchitectureTooltip;

  if (saving) {
    tooltipText = labels.saveArchitectureSaving;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="outline"
            size="icon"
            disabled={disabled || saving}
            onClick={handleSave}
            aria-label={labels.saveArchitecture}
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
