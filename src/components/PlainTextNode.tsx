import { useLayoutEffect, useRef, useState } from "react";
import {
  NodeResizer,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import {
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
  MIN_TEXT_NODE_HEIGHT,
  MIN_TEXT_NODE_WIDTH,
  getTextFontSizeForWidth,
  getFittedTextNodeSize,
  fitFontSizeToBox,
} from "@/lib/text-node-utils";

const DEFAULT_TEXT_NODE_WIDTH = 180;

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

  const rect = textElement.getBoundingClientRect();
  const xRatio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
  return Math.round(clamp(xRatio, 0, 1) * textElement.textContent!.length);
}

export type PlainTextNodeData = {
  text: string;
  fontSize?: number;
  isEditing?: boolean;
  pulseKey?: string;
};

export type PlainTextNodeType = Node<PlainTextNodeData, "plainText">;

const DEFAULT_TEXT_NODE_HEIGHT = 56;

export default function PlainTextNode({
  id,
  data,
  selected,
  width = DEFAULT_TEXT_NODE_WIDTH,
  height = DEFAULT_TEXT_NODE_HEIGHT,
}: NodeProps<PlainTextNodeType>) {
  const commitGraphChange = useFlowStore((state) => state.commitGraphChange);
  const setNodes = useFlowStore((state) => state.setNodes);
  const [isEditing, setIsEditing] = useState(Boolean(data.isEditing));
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const displayTextRef = useRef<HTMLSpanElement>(null);
  const pendingCaretOffsetRef = useRef<number | null>(null);
  const skipNextBlurRef = useRef(false);
  const isResizingRef = useRef(false);
  const t = UI_TEXT[getBrowserLocale()];
  const fontSize = clamp(
    data.fontSize ?? getTextFontSizeForWidth(width),
    MIN_TEXT_FONT_SIZE,
    MAX_TEXT_FONT_SIZE,
  );

  // Auto-height: after every render triggered by text/width/fontSize/height change,
  // measure the display div's natural height and correct the node if they diverge.
  // Guard: `Math.abs(height - targetHeight) <= 1` short-circuits when already in sync,
  // preventing infinite loops — `setNodes` changes `height` which re-runs this effect,
  // but then the guard exits immediately.
  useLayoutEffect(() => {
    if (isEditing || isResizingRef.current || !displayRef.current) return;
    const contentHeight = displayRef.current.offsetHeight;
    const targetHeight = Math.max(contentHeight, MIN_TEXT_NODE_HEIGHT);
    if (Math.abs(height - targetHeight) <= 1) return;
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id !== id
          ? n
          : { ...n, height: targetHeight, style: { ...n.style, height: targetHeight } },
      ),
    );
  }, [data.text, width, fontSize, height, isEditing, id, setNodes]);

  // Auto-resize textarea height as user types.
  useLayoutEffect(() => {
    if (!isEditing || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isEditing]);

  // Focus and caret placement when editing starts.
  useLayoutEffect(() => {
    if (!isEditing) return;
    const caretOffset = pendingCaretOffsetRef.current;
    pendingCaretOffsetRef.current = null;
    const focusInput = () => {
      textareaRef.current?.focus();
      if (caretOffset == null) {
        textareaRef.current?.select();
        return;
      }
      textareaRef.current?.setSelectionRange(caretOffset, caretOffset);
    };

    focusInput();
    const frameId = requestAnimationFrame(focusInput);
    const timeoutId = window.setTimeout(focusInput, 80);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [isEditing]);

  function updateText(nextText: string) {
    setIsEditing(false);

    commitGraphChange(({ nodes, edges }) => {
      if (!nextText) {
        return {
          nodes: nodes.filter((node) => node.id !== id),
          edges: edges.filter(
            (edge) => edge.source !== id && edge.target !== id,
          ),
        };
      }

      return {
        nodes: nodes.map((node) => {
          if (node.id !== id) return node;

          // Shrink width to fit single-line text if the text is short enough,
          // but never expand — a narrow multi-line node must stay narrow.
          const fittedWidth = getFittedTextNodeSize(nextText, fontSize).width;
          const newWidth = Math.min(node.width ?? width, fittedWidth);

          return {
            ...node,
            width: newWidth,
            style: { ...node.style, width: newWidth },
            data: {
              ...node.data,
              text: nextText,
              fontSize,
              isEditing: false,
            },
          };
        }),
        edges,
      };
    });
  }

  function commit() {
    updateText(draft.trim());
  }

  function cancel() {
    skipNextBlurRef.current = true;
    setDraft(data.text);
    setIsEditing(false);

    if (!data.text.trim()) {
      updateText("");
    }
  }

  function handleResize(_event: unknown, params: { width: number; height: number }) {
    const nextFontSize = fitFontSizeToBox(data.text, params.width, params.height);

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                fontSize: nextFontSize,
              },
            }
          : node,
      ),
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded border border-transparent bg-transparent text-foreground",
        data.pulseKey && "node-click-pulse",
        selected && !isEditing
          ? "border-primary bg-background/75 shadow-sm"
          : "bg-transparent",
      )}
      onDoubleClick={(event) => {
        event.stopPropagation();
        pendingCaretOffsetRef.current = displayTextRef.current
          ? getTextCaretOffsetFromPoint(
              displayTextRef.current,
              event.clientX,
              event.clientY,
            )
          : null;
        setDraft(data.text);
        setIsEditing(true);
      }}
      onPointerDown={(event) => {
        if (isEditing) event.stopPropagation();
      }}
    >
      <NodeResizer
        isVisible={selected && !isEditing}
        minWidth={MIN_TEXT_NODE_WIDTH}
        minHeight={MIN_TEXT_NODE_HEIGHT}
        onResizeStart={() => {
          isResizingRef.current = true;
        }}
        onResize={handleResize}
        onResizeEnd={(event, params) => {
          isResizingRef.current = false;
          handleResize(event, params);
        }}
        lineClassName="!border-primary/70"
        handleClassName="!h-3 !w-3 !rounded-full !border-2 !border-primary !bg-background"
      />
      {isEditing ? (
        <div className="nodrag flex h-full w-full items-start px-2 py-1">
          <textarea
            ref={textareaRef}
            autoFocus
            aria-label={t.editTextNode}
            className="nodrag w-full resize-none rounded border border-primary/60 bg-background/95 px-1.5 py-0.5 font-medium leading-tight text-foreground shadow-sm outline-none selection:bg-node-label-selection selection:text-node-label-selection-text"
            style={{ fontSize, overflow: "hidden", minHeight: 0 }}
            rows={1}
            value={draft}
            placeholder={t.textNodePlaceholder}
            onBlur={() => {
              if (skipNextBlurRef.current) {
                skipNextBlurRef.current = false;
                return;
              }
              commit();
            }}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onDoubleClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                skipNextBlurRef.current = true;
                commit();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
          />
        </div>
      ) : (
        <div
          ref={displayRef}
          className="cursor-grab px-2 py-1 active:cursor-grabbing"
        >
          <span
            ref={displayTextRef}
            className="block min-w-0 whitespace-pre-wrap wrap-break-word font-medium leading-tight"
            style={{ fontSize }}
          >
            {data.text}
          </span>
        </div>
      )}
    </div>
  );
}
