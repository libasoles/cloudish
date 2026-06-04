type LabeledSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  onChange: (value: number) => void;
};

export default function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
}: LabeledSliderProps) {
  return (
    <label className="grid gap-4 text-sm font-medium text-foreground">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <output className="font-mono text-sm text-muted-foreground">
          {formatValue ? formatValue(value) : value}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="h-0.5 w-full cursor-pointer accent-primary"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
