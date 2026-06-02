import ChildCountSlider from "@/components/ChildCountSlider";
import { Input } from "@/components/ui/input";
import type { UI_TEXT } from "@/i18n";
import type { FieldValue } from "@/lib/node-utils";

export type VpcInspectorPanelProps = {
  childCount: number;
  containerFields: Record<string, FieldValue>;
  onChildCountChange: (count: number) => void;
  onContainerFieldChange: (fieldKey: string, value: FieldValue) => void;
  t: typeof UI_TEXT["en"];
};

export function VpcInspectorPanel({
  childCount,
  containerFields,
  onChildCountChange,
  onContainerFieldChange,
  t,
}: VpcInspectorPanelProps) {
  return (
    <div className="space-y-4 text-sm">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.cidrBlock}
        <Input
          value={String(containerFields.cidrBlock ?? "")}
          placeholder={t.vpcCidrBlockPlaceholder}
          onChange={(event) =>
            onContainerFieldChange("cidrBlock", event.target.value)
          }
        />
      </label>
      <ChildCountSlider
        label={t.numberOfAZs}
        value={childCount}
        onChange={onChildCountChange}
      />
    </div>
  );
}
