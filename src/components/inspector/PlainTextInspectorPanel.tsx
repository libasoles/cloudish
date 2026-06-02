import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
  clampTextFontSize,
  getTextFontSizeForNodeSize,
  getTextNodeSizeForFont,
} from "@/lib/text-node-utils";
import { getNodeSize } from "@/lib/graph-utils";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import type { AppNode } from "@/types/flow";
import type { PlainTextNodeData } from "@/components/PlainTextNode";

type PlainTextInspectorPanelProps = {
  node: AppNode;
};

export function PlainTextInspectorPanel({ node }: PlainTextInspectorPanelProps) {
  const { setNodes } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const data = node.data as PlainTextNodeData;
  const text = data.text ?? "";
  const { width, height } = getNodeSize(node);
  const fontSize = Math.round(
    data.fontSize ?? getTextFontSizeForNodeSize(width, height),
  );

  const onTextChange = useCallback(
    (nextText: string) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, text: nextText } } : n,
        ),
      );
    },
    [setNodes, node.id],
  );

  const onFontSizeChange = useCallback(
    (nextFontSize: number) => {
      const clamped = clampTextFontSize(nextFontSize);
      const nextSize = getTextNodeSizeForFont(clamped);
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                width: nextSize.width,
                height: nextSize.height,
                style: {
                  ...n.style,
                  width: nextSize.width,
                  height: nextSize.height,
                },
                data: { ...n.data, fontSize: clamped },
              }
            : n,
        ),
      );
    },
    [setNodes, node.id],
  );

  return (
    <div className="space-y-4 text-sm">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.textContent}
        <Input
          value={text}
          placeholder={t.textNodePlaceholder}
          onChange={(event) => onTextChange(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        <span className="flex items-center justify-between gap-3">
          <span>{t.textFontSize}</span>
          <output className="font-mono text-sm text-muted-foreground">
            {fontSize}px
          </output>
        </span>
        <input
          type="range"
          min={MIN_TEXT_FONT_SIZE}
          max={MAX_TEXT_FONT_SIZE}
          step={1}
          value={fontSize}
          className="h-0.5 w-full cursor-pointer accent-primary"
          onChange={(event) => onFontSizeChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
