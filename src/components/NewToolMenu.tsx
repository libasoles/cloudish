import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NewToolMenuProps = {
  labels: {
    newTool: string;
    newToolTooltip: string;
    newToolConfirmTitle: string;
    newToolConfirmDescription: string;
    newToolConfirmAction: string;
    newToolConfirmCancel: string;
  };
  onReset: () => void;
};

export default function NewToolMenu({ labels, onReset }: NewToolMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (open) setTooltipOpen(false);
  }

  function handleReset() {
    setTooltipOpen(false);
    onReset();
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <Tooltip open={tooltipOpen && !dialogOpen}>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={labels.newTool}
              onPointerEnter={() => setTooltipOpen(true)}
              onPointerLeave={() => setTooltipOpen(false)}
              onClick={() => setTooltipOpen(false)}
            >
              <Plus />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">{labels.newToolTooltip}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.newToolConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {labels.newToolConfirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{labels.newToolConfirmCancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>
            {labels.newToolConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
