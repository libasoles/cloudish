import { useCallback, useLayoutEffect, useRef, useState } from "react";
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
  MIN_TEXT_FONT_SIZE,
  MIN_TEXT_NODE_HEIGHT,
  MIN_TEXT_NODE_WIDTH,
  getTextFontSizeForNodeSize,
} from "@/lib/text-node-utils";

const DEFAULT_TEXT_NODE_WIDTH = 180;
const DEFAULT_TEXT_NODE_HEIGHT = 56;
const TEXT_HORIZONTAL_PADDING = 16;
const TEXT_VERTICAL_PADDING = 8;
const CARET_SPACE = 4;
const TEXT_MEASUREMENT_BUFFER = 8;
const EDITING_INPUT_HORIZONTAL_PADDING = 12;
const EDITING_INPUT_BORDER_WIDTH = 2;
const EDITING_INPUT_SCROLL_BUFFER = 8;
const EDITING_PLACEHOLDER_BUFFER = 4;
const REAL_INPUT_OVERFLOW_BUFFER = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function measureTextWidth(text: string, fontSize: number) {
  if (typeof document === "undefined") {
    return text.length * fontSize * 0.55;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return text.length * fontSize * 0.55;
  }

  context.font = `500 ${fontSize}px system-ui, "Segoe UI", Roboto, sans-serif`;
  return context.measureText(text).width;
}

function getFittedTextNodeSize(text: string, fontSize: number) {
  return {
    width: Math.max(
      Math.ceil(
        measureTextWidth(text, fontSize) +
          TEXT_HORIZONTAL_PADDING +
          TEXT_MEASUREMENT_BUFFER,
      ),
      MIN_TEXT_NODE_WIDTH,
    ),
    height: clamp(
      Math.ceil(fontSize * 1.15 + TEXT_VERTICAL_PADDING),
      MIN_TEXT_NODE_HEIGHT,
      MAX_TEXT_NODE_HEIGHT,
    ),
  };
}

function getEditingInputContentWidth(
  text: string,
  placeholder: string,
  fontSize: number,
) {
  const placeholderBuffer = text ? 0 : EDITING_PLACEHOLDER_BUFFER;

  return Math.ceil(
    measureTextWidth(text || placeholder, fontSize) +
      CARET_SPACE +
      EDITING_INPUT_SCROLL_BUFFER +
      placeholderBuffer,
  );
}

function getEditingTextNodeSizeForInputWidth(
  inputContentWidth: number,
  fontSize: number,
) {
  return {
    width: Math.max(
      Math.ceil(
        inputContentWidth +
          TEXT_HORIZONTAL_PADDING +
          EDITING_INPUT_HORIZONTAL_PADDING +
          EDITING_INPUT_BORDER_WIDTH +
          TEXT_MEASUREMENT_BUFFER,
      ),
      MIN_TEXT_NODE_WIDTH,
    ),
    height: clamp(
      Math.ceil(fontSize * 1.15 + TEXT_VERTICAL_PADDING),
      MIN_TEXT_NODE_HEIGHT,
      MAX_TEXT_NODE_HEIGHT,
    ),
  };
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
  const editingSyncedRef = useRef(false);
  const t = UI_TEXT[getBrowserLocale()];
  const fontSize = clamp(
    data.fontSize ?? getTextFontSizeForNodeSize(width, height),
    MIN_TEXT_FONT_SIZE,
    MAX_TEXT_FONT_SIZE,
  );
  const measuredInputWidth = getEditingInputContentWidth(
    draft,
    t.textNodePlaceholder,
    fontSize,
  );
  const [inputContentWidth, setInputContentWidth] =
    useState(measuredInputWidth);
  const inputWidth = `${Math.max(inputContentWidth, measuredInputWidth)}px`;

  const resizeNodeForInputWidth = useCallback(
    (nextInputWidth: number) => {
      const nextSize = getEditingTextNodeSizeForInputWidth(
        nextInputWidth,
        fontSize,
      );

      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== id) {
            return node;
          }

          return {
            ...node,
            width: nextSize.width,
            height: nextSize.height,
            style: {
              ...node.style,
              width: nextSize.width,
              height: nextSize.height,
            },
          };
        }),
      );
    },
    [fontSize, id, setNodes],
  );

  useLayoutEffect(() => {
    if (!isEditing) {
      editingSyncedRef.current = false;
      return;
    }
    if (editingSyncedRef.current) return;
    editingSyncedRef.current = true;
    resizeNodeForInputWidth(inputContentWidth);
  }, [isEditing, resizeNodeForInputWidth, inputContentWidth]);

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

  useLayoutEffect(() => {
    if (!isEditing || !inputRef.current) return;

    const overflowWidth =
      inputRef.current.scrollWidth - inputRef.current.clientWidth;

    if (overflowWidth <= 1) {
      inputRef.current.scrollLeft = 0;
      return;
    }

    const nextInputWidth =
      inputContentWidth + overflowWidth + REAL_INPUT_OVERFLOW_BUFFER;
    setInputContentWidth(nextInputWidth);
    resizeNodeForInputWidth(nextInputWidth);
  }, [
    draft,
    inputContentWidth,
    inputWidth,
    isEditing,
    resizeNodeForInputWidth,
  ]);

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
          if (node.id !== id) {
            return node;
          }

          const nextSize = getFittedTextNodeSize(nextText, fontSize);

          return {
            ...node,
            width: nextSize.width,
            height: nextSize.height,
            style: {
              ...node.style,
              width: nextSize.width,
              height: nextSize.height,
            },
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

  function resizeNodeForDraft(nextDraft: string) {
    const nextInputWidth = getEditingInputContentWidth(
      nextDraft,
      t.textNodePlaceholder,
      fontSize,
    );
    setInputContentWidth(nextInputWidth);
    resizeNodeForInputWidth(nextInputWidth);
  }

  function cancel() {
    skipNextBlurRef.current = true;
    setDraft(data.text);
    setIsEditing(false);

    if (!data.text.trim()) {
      updateText("");
      return;
    }

    const nextSize = getFittedTextNodeSize(data.text, fontSize);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              width: nextSize.width,
              height: nextSize.height,
              style: {
                ...node.style,
                width: nextSize.width,
                height: nextSize.height,
              },
            }
          : node,
      ),
    );
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
        setInputContentWidth(
          getEditingInputContentWidth(
            data.text,
            t.textNodePlaceholder,
            fontSize,
          ),
        );
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
            className="nodrag rounded border border-primary/60 bg-background/95 px-1.5 py-0.5 font-medium leading-tight text-foreground shadow-sm outline-none selection:bg-node-label-selection selection:text-node-label-selection-text"
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
            onChange={(event) => {
              const nextDraft = event.target.value;
              setDraft(nextDraft);
              resizeNodeForDraft(nextDraft);
            }}
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
            className="block min-w-0 flex-1 whitespace-pre font-medium leading-tight"
            style={{ fontSize }}
          >
            {data.text}
          </span>
        </div>
      )}
    </div>
  );
}
