type ChildCountSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const MIN_CHILD_COUNT = 0;
const MAX_CHILD_COUNT = 5;

function clampChildCount(value: number) {
  return Math.max(MIN_CHILD_COUNT, Math.min(MAX_CHILD_COUNT, value));
}

export default function ChildCountSlider({
  label,
  value,
  onChange,
}: ChildCountSliderProps) {
  const sliderValue = clampChildCount(value);

  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <output className="font-mono text-sm text-muted-foreground">
          {sliderValue}
        </output>
      </span>
      <input
        type="range"
        min={MIN_CHILD_COUNT}
        max={MAX_CHILD_COUNT}
        step={1}
        value={sliderValue}
        className="h-1 w-full cursor-pointer accent-primary"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
