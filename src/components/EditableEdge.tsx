import { useEffect, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useFlowStore } from "@/store/flowStore";

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerStart,
  markerEnd,
  label,
}: EdgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(label ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);
  const commitGraphChange = useFlowStore((s) => s.commitGraphChange);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(String(label ?? ""));
    setIsEditing(true);
  }

  function commit() {
    const nextValue = draft.trim();
    setIsEditing(false);
    commitGraphChange(({ nodes, edges }) => ({
      nodes,
      edges: edges.map((e) =>
        e.id === id ? { ...e, label: nextValue || undefined } : e,
      ),
    }));
  }

  const inputCharacterWidth = Math.min(Math.max(draft.length, 4), 24);

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={style}
        markerStart={markerStart}
        markerEnd={markerEnd}
        onDoubleClick={startEditing}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              aria-label="Edge label"
              className={cn(
                "border-0 border-b border-blue-400 bg-transparent px-1 py-0.5 text-center text-xs font-medium text-white outline-none",
                "selection:bg-node-label-selection selection:text-node-label-selection-text",
                "focus:border-blue-600",
              )}
              style={{ width: `${inputCharacterWidth}ch` }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(String(label ?? ""));
                  setIsEditing(false);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : label ? (
            <span
              className="cursor-default select-none rounded px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ background: "hsl(var(--background) / 0.84)" }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
            >
              {String(label)}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
