import LabeledSlider from "./LabeledSlider";

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
  return (
    <LabeledSlider
      label={label}
      value={clampChildCount(value)}
      min={MIN_CHILD_COUNT}
      max={MAX_CHILD_COUNT}
      onChange={onChange}
    />
  );
}
