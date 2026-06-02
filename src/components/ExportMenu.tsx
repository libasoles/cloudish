import { useState } from "react";
import { Download, FileCode2, FileText } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ExportFormat } from "@/lib/export";

type ExportMenuLabels = {
  exportTooltip: string;
  exportTerraform: string;
  exportCloudFormation: string;
  exportDisclaimerTitle: string;
  exportDisclaimerDescription: string;
  exportDisclaimerAction: string;
  exportDisclaimerCancel: string;
};

type ExportMenuProps = {
  labels: ExportMenuLabels;
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
};

export default function ExportMenu({
  labels,
  onExport,
  disabled,
}: ExportMenuProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

  function handleFormatClick(format: ExportFormat) {
    setPopoverOpen(false);
    setPendingFormat(format);
  }

  function handleConfirm() {
    if (pendingFormat) {
      onExport(pendingFormat);
    }
    setPendingFormat(null);
  }

  function handleCancel() {
    setPendingFormat(null);
  }

  return (
    <>
      <Popover
        open={disabled ? false : popoverOpen}
        onOpenChange={disabled ? undefined : setPopoverOpen}
      >
        <HoverOnlyTooltip
          content={labels.exportTooltip}
          side="left"
          disabled={popoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label={labels.exportTooltip}
            >
              <Download />
            </Button>
          </PopoverTrigger>
        </HoverOnlyTooltip>
        <PopoverContent side="left" align="start" className="w-64 p-1">
          <button
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleFormatClick("terraform")}
          >
            <FileCode2 className="size-4 shrink-0 text-purple-400" />
            {labels.exportTerraform}
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleFormatClick("cloudformation")}
          >
            <FileText className="size-4 shrink-0 text-orange-400" />
            {labels.exportCloudFormation}
          </button>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={pendingFormat !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFormat(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.exportDisclaimerTitle}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <Alert className="mt-2 border-yellow-500/40 bg-yellow-500/10">
                  <AlertTitle className="text-yellow-400">
                    ⚠ Disclaimer
                  </AlertTitle>
                  <AlertDescription className="text-zinc-100">
                    {labels.exportDisclaimerDescription}
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {labels.exportDisclaimerCancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              <Download className="mr-2 size-4" />
              {labels.exportDisclaimerAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
