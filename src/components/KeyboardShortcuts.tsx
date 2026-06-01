import { useEffect } from "react";
import { useFlowStore } from "@/store/flowStore";

export function KeyboardShortcuts() {
  const undo = useFlowStore((s) => s.undo);
  const duplicateSelectedNodes = useFlowStore((s) => s.duplicateSelectedNodes);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const key = e.key.toLowerCase();
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && key === "z") {
        e.preventDefault();
        undo();
        return;
      }

      const isDuplicateShortcut =
        !e.shiftKey &&
        !e.altKey &&
        ((isMac && e.metaKey && key === "d") ||
          (!isMac && e.ctrlKey && key === "d"));

      if (isDuplicateShortcut) {
        e.preventDefault();
        duplicateSelectedNodes();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duplicateSelectedNodes, undo]);

  return null;
}
