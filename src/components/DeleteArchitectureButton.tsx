import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { useToast } from "@/components/ui/use-toast";

type DeleteArchitectureButtonLabels = {
  deleteArchitecture: string;
  deleteArchitectureTooltip: string;
  deleteArchitectureDeleting: string;
  deleteArchitectureConfirmTitle: string;
  deleteArchitectureConfirmDescription: string;
  deleteArchitectureConfirmAction: string;
  deleteArchitectureConfirmCancel: string;
  deleteArchitectureDeleted: string;
  deleteArchitectureDeletedDescription: string;
  deleteArchitectureFailed: string;
  deleteArchitectureFailedDescription: string;
};

type DeleteArchitectureButtonProps = {
  labels: DeleteArchitectureButtonLabels;
  onDelete: () => Promise<void>;
};

export default function DeleteArchitectureButton({
  labels,
  onDelete,
}: DeleteArchitectureButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  async function handleConfirmDelete() {
    setDeleting(true);

    try {
      await onDelete();
      setDialogOpen(false);
      toast({
        title: labels.deleteArchitectureDeleted,
        description: labels.deleteArchitectureDeletedDescription,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: labels.deleteArchitectureFailed,
        description: labels.deleteArchitectureFailedDescription,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  let tooltipText = labels.deleteArchitectureTooltip;
  if (deleting) {
    tooltipText = labels.deleteArchitectureDeleting;
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <HoverOnlyTooltip
        content={tooltipText}
        side="left"
        disabled={dialogOpen}
      >
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={deleting}
            aria-label={labels.deleteArchitecture}
          >
            {deleting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}
          </Button>
        </AlertDialogTrigger>
      </HoverOnlyTooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {labels.deleteArchitectureConfirmTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {labels.deleteArchitectureConfirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {labels.deleteArchitectureConfirmCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirmDelete();
            }}
          >
            {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {!deleting && <Trash2 className="mr-2 size-4" />}
            {labels.deleteArchitectureConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
