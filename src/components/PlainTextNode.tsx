import { useLayoutEffect, useRef, useState } from "react";
import {
  NodeResizer,
  type Node,
  type NodeProps,
  type ResizeParamsWithDirection,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/store/flowStore";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import {
  MAX_TEXT_FONT_SIZE,
  MAX_TEXT_NODE_HEIGHT,
  MAX_TEXT_NODE_WIDTH,
  MIN_TEXT_FONT_SIZE,
  MIN_TEXT_NODE_HEIGHT,
  MIN_TEXT_NODE_WIDTH,
  getTextFontSizeForNodeSize,
} from "@/lib/text-node-utils";

const DEFAULT_TEXT_NODE_WIDTH = 180;
const DEFAULT_TEXT_NODE_HEIGHT = 56;

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
  const inputRef = useRef<HTMLInputElement>(null);
  const displayTextRef = useRef<HTMLSpanElement>(null);
  const pendingCaretOffsetRef = useRef<number | null>(null);
  const skipNextBlurRef = useRef(false);
  const t = UI_TEXT[getBrowserLocale()];
  const fontSize = clamp(
    data.fontSize ?? getTextFontSizeForNodeSize(width, height),
    MIN_TEXT_FONT_SIZE,
    MAX_TEXT_FONT_SIZE,
  );
  const inputWidth = `${Math.max(draft.length, t.textNodePlaceholder.length)}ch`;

  useLayoutEffect(() => {
    if (!isEditing) return;
    const caretOffset = pendingCaretOffsetRef.current;
    pendingCaretOffsetRef.current = null;
    const focusInput = () => {
      inputRef.current?.focus();
      if (caretOffset == null) {
        inputRef.current?.select();
        return;
      }

      inputRef.current?.setSelectionRange(caretOffset, caretOffset);
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
          edges: edges.filter((edge) => edge.source !== id && edge.target !== id),
        };
      }

      return {
        nodes: nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  text: nextText,
                  isEditing: false,
                },
              }
            : node,
        ),
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

  function handleResize(_event: unknown, params: ResizeParamsWithDirection) {
    const nextFontSize = getTextFontSizeForNodeSize(
      params.width,
      params.height,
    );

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
        maxWidth={MAX_TEXT_NODE_WIDTH}
        maxHeight={MAX_TEXT_NODE_HEIGHT}
        onResize={handleResize}
        lineClassName="!border-primary/70"
        handleClassName="!h-3 !w-3 !rounded-full !border-2 !border-primary !bg-background"
      />
      {isEditing ? (
        <div className="nodrag flex h-full w-full items-center px-2 py-1">
          <input
            ref={inputRef}
            autoFocus
            aria-label={t.editTextNode}
            className="nodrag max-w-full border-0 border-b border-primary bg-transparent px-0 py-0 font-medium leading-tight text-foreground outline-none selection:bg-node-label-selection selection:text-node-label-selection-text"
            style={{ fontSize, width: inputWidth }}
            value={draft}
            placeholder={t.textNodePlaceholder}
            onBlur={() => {
              if (skipNextBlurRef.current) {
                skipNextBlurRef.current = false;
                return;
              }

              commit();
            }}
            onChange={(event) => setDraft(event.target.value)}
            onDoubleClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
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
        <div className="flex h-full w-full cursor-grab items-center px-2 py-1 active:cursor-grabbing">
          <span
            ref={displayTextRef}
            className="block min-w-0 flex-1 whitespace-pre-wrap break-words font-medium leading-tight"
            style={{ fontSize }}
          >
            {data.text}
          </span>
        </div>
      )}
    </div>
  );
}
