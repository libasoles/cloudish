import { Input } from "@/components/ui/input";
import { MAX_TEXT_FONT_SIZE, MIN_TEXT_FONT_SIZE } from "@/lib/text-node-utils";
import type { UI_TEXT } from "@/i18n";

type PlainTextInspectorPanelProps = {
  text: string;
  fontSize: number;
  onTextChange: (text: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  t: typeof UI_TEXT["en"];
};

export function PlainTextInspectorPanel({
  text,
  fontSize,
  onTextChange,
  onFontSizeChange,
  t,
}: PlainTextInspectorPanelProps) {
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
