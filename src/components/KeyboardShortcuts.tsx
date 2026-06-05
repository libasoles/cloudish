import { useEffect } from "react";
import { useFlowStore } from "@/store/flowStore";

type ShortcutModifiers = {
  primary?: boolean;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type KeyboardShortcut = {
  key: string;
  modifiers?: ShortcutModifiers;
  action: () => void;
};

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

function isApplePlatform() {
  const platform =
    (navigator as NavigatorWithUserAgentData).userAgentData?.platform ??
    navigator.platform;

  return /mac|iphone|ipad|ipod/i.test(platform);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.matches("input, textarea, select") ||
    target.closest("[contenteditable='true'], [contenteditable='']") !== null ||
    target.isContentEditable
  );
}

function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut,
  isMac: boolean,
) {
  const modifiers = shortcut.modifiers ?? {};
  const expectsPrimary = modifiers.primary ?? false;
  const expectedMeta = modifiers.meta ?? (isMac ? expectsPrimary : false);
  const expectedCtrl = modifiers.ctrl ?? (!isMac ? expectsPrimary : false);
  const expectedShift = modifiers.shift ?? false;
  const expectedAlt = modifiers.alt ?? false;

  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.metaKey === expectedMeta &&
    event.ctrlKey === expectedCtrl &&
    event.shiftKey === expectedShift &&
    event.altKey === expectedAlt
  );
}

export function KeyboardShortcuts() {
  const undo = useFlowStore((s) => s.undo);
  const duplicateSelectedNodes = useFlowStore((s) => s.duplicateSelectedNodes);

  useEffect(() => {
    const isMac = isApplePlatform();
    const shortcuts: KeyboardShortcut[] = [
      {
        key: "z",
        modifiers: { primary: true },
        action: undo,
      },
      {
        key: "d",
        modifiers: { primary: true },
        action: duplicateSelectedNodes,
      },
    ];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) {
        return;
      }

      if (isEditableTarget(e.target)) {
        return;
      }

      const match = shortcuts.find((shortcut) =>
        matchesShortcut(e, shortcut, isMac),
      );
      if (match) {
        e.preventDefault();
        match.action();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duplicateSelectedNodes, undo]);

  return null;
}
