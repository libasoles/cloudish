import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type EditableNodeLabelProps = {
  value: string;
  editLabel: string;
  className?: string;
  onCommit: (value: string) => void;
};

export default function EditableNodeLabel({
  value,
  editLabel,
  className,
  onCommit,
}: EditableNodeLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputCharacterWidth = Math.min(Math.max(draft.length, 3), 14);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function commit() {
    const nextValue = draft.trim();
    setIsEditing(false);

    if (nextValue && nextValue !== value) {
      onCommit(nextValue);
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        aria-label={editLabel}
        className={cn(
          "nodrag max-w-24 border-0 border-b border-blue-400 bg-transparent px-0.5 py-0 text-center text-xs font-medium leading-tight text-gray-700 outline-none selection:bg-blue-100 selection:text-gray-900 focus:border-blue-600",
          className,
        )}
        style={{ width: `${inputCharacterWidth}ch` }}
        value={draft}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onDoubleClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
          }

          if (event.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={cn(
        "max-w-24 overflow-hidden text-center text-xs font-medium leading-tight text-gray-700",
        className,
      )}
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflowWrap: "anywhere",
      }}
      title={value}
      onDoubleClick={(event) => {
        event.stopPropagation();
        setDraft(value);
        setIsEditing(true);
      }}
    >
      {value}
    </span>
  );
}
