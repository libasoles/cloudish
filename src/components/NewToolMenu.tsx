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

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Tooltip open={dialogOpen ? false : undefined}>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={labels.newTool}
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
          <AlertDialogAction onClick={onReset}>
            {labels.newToolConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
