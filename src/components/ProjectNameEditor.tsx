import { useLayoutEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { cn } from "@/lib/utils";

type ProjectNameEditorProps = {
  value: string | null;
  onChange: (value: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTextCaretOffsetFromPoint(
  textElement: HTMLSpanElement,
  clientX: number,
  clientY: number,
) {
  const documentWithCaret = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const textNode = textElement.firstChild;

  const caretPosition = documentWithCaret.caretPositionFromPoint?.(
    clientX,
    clientY,
  );
  if (caretPosition && caretPosition.offsetNode === textNode) {
    return caretPosition.offset;
  }

  const caretRange = documentWithCaret.caretRangeFromPoint?.(clientX, clientY);
  if (caretRange && caretRange.startContainer === textNode) {
    return caretRange.startOffset;
  }

  const text = textElement.textContent ?? "";
  const rect = textElement.getBoundingClientRect();
  const xRatio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
  return Math.round(clamp(xRatio, 0, 1) * text.length);
}

export function ProjectNameEditor({ value, onChange }: ProjectNameEditorProps) {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];
  const fallbackName = t.defaultArchitectureName;
  const displayName = value?.trim() || fallbackName;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayTextRef = useRef<HTMLSpanElement>(null);
  const pendingCaretOffsetRef = useRef<number | null>(null);
  const selectAllOnFocusRef = useRef(false);

  useLayoutEffect(() => {
    if (!isEditing) return;
    const caretOffset = pendingCaretOffsetRef.current;
    pendingCaretOffsetRef.current = null;
    const shouldSelectAll = selectAllOnFocusRef.current;
    selectAllOnFocusRef.current = false;

    const focusInput = () => {
      inputRef.current?.focus();
      if (shouldSelectAll) {
        inputRef.current?.select();
        return;
      }

      if (caretOffset == null) {
        inputRef.current?.setSelectionRange(draft.length, draft.length);
        return;
      }

      inputRef.current?.setSelectionRange(caretOffset, caretOffset);
    };

    focusInput();
    const frameId = requestAnimationFrame(focusInput);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [draft.length, isEditing]);

  function beginEditing({
    caretOffset = null,
    selectAll = false,
  }: { caretOffset?: number | null; selectAll?: boolean } = {}) {
    setDraft(displayName);
    pendingCaretOffsetRef.current = caretOffset;
    selectAllOnFocusRef.current = selectAll;
    setIsEditing(true);
  }

  function commit() {
    const nextName = draft.trim() || fallbackName;
    setIsEditing(false);
    onChange(nextName);
  }

  function cancel() {
    setDraft(displayName);
    setIsEditing(false);
  }

  return (
    <div
      className="absolute right-48 bottom-9 z-10 max-w-[min(28rem,calc(100%-1.5rem))]"
      onDoubleClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex max-w-full items-center gap-0.5">
        {isEditing ? (
          <div className="inline-grid min-w-0 max-w-full align-top">
            <input
              ref={inputRef}
              className={cn(
                "nodrag col-start-1 row-start-1 w-full min-w-2 border-0 border-b border-primary/70 bg-background/80 px-0 pb-1 pt-0",
                "text-lg font-medium leading-tight text-foreground/85 shadow-none outline-none",
                "selection:bg-node-label-selection selection:text-node-label-selection-text",
              )}
              aria-label={t.editProjectName}
              value={draft}
              onBlur={commit}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  cancel();
                }
              }}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
            />
            <span
              className="invisible col-start-1 row-start-1 whitespace-pre border-b border-transparent pb-1 text-lg font-medium leading-tight"
              aria-hidden="true"
            >
              {draft || " "}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="min-w-0 truncate rounded-sm bg-background/70 px-0 py-0 text-left text-lg font-medium leading-tight text-foreground/60 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={(event) => {
              const caretOffset = displayTextRef.current
                ? getTextCaretOffsetFromPoint(
                    displayTextRef.current,
                    event.clientX,
                    event.clientY,
                  )
                : null;
              beginEditing({ caretOffset });
            }}
          >
            <span ref={displayTextRef}>{displayName}</span>
          </button>
        )}
        <HoverOnlyTooltip content={t.editProjectName} side="bottom">
          <button
            type="button"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-foreground/60 outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={t.editProjectName}
            onMouseDown={(event) => {
              if (isEditing) event.preventDefault();
            }}
            onClick={() => beginEditing({ selectAll: true })}
          >
            <Pencil className="size-3.5" />
          </button>
        </HoverOnlyTooltip>
      </div>
    </div>
  );
}
