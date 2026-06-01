import { FilePlus } from "lucide-react";
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
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="gap-2 px-3"
              aria-label={labels.newTool}
            >
              <FilePlus className="size-5" />
              <span>{labels.newTool}</span>
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
