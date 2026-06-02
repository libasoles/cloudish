import ChildCountSlider from "@/components/ChildCountSlider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UI_TEXT } from "@/i18n";
import type { FieldValue } from "@/lib/node-utils";
import type { AppNode, NetworkContainerNodeData } from "@/types/flow";

export type RegionInspectorPanelProps = {
  node: AppNode;
  childCount: number;
  containerFields: Record<string, FieldValue>;
  onChildCountChange: (count: number) => void;
  onContainerFieldChange: (fieldKey: string, value: FieldValue) => void;
  onRegionChange: (region: string) => void;
  t: typeof UI_TEXT["en"];
};

export function RegionInspectorPanel({
  node,
  childCount,
  onChildCountChange,
  onRegionChange,
  t,
}: RegionInspectorPanelProps) {
  const currentRegion =
    ((node.data as NetworkContainerNodeData).fields?.region as string) ??
    "us-east-1";

  return (
    <div className="space-y-4 text-sm">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.region}
        <Select value={currentRegion} onValueChange={onRegionChange}>
          <SelectTrigger className="font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
            <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
            <SelectItem value="us-west-1">US West (N. California)</SelectItem>
            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
            <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
            <SelectItem value="eu-west-2">Europe (London)</SelectItem>
            <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
            <SelectItem value="ap-southeast-1">
              Asia Pacific (Singapore)
            </SelectItem>
            <SelectItem value="ap-southeast-2">
              Asia Pacific (Sydney)
            </SelectItem>
            <SelectItem value="ap-northeast-1">
              Asia Pacific (Tokyo)
            </SelectItem>
            <SelectItem value="sa-east-1">
              South America (São Paulo)
            </SelectItem>
          </SelectContent>
        </Select>
      </label>
      <ChildCountSlider
        label={t.numberOfVPCs}
        value={childCount}
        onChange={onChildCountChange}
      />
    </div>
  );
}
