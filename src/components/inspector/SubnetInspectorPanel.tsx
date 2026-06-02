import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UI_TEXT } from "@/i18n";
import type { FieldValue } from "@/lib/node-utils";
import type { AppNode, SubnetNodeData, SubnetType } from "@/types/flow";

export type SubnetInspectorPanelProps = {
  node: AppNode;
  containerFields: Record<string, FieldValue>;
  onContainerFieldChange: (fieldKey: string, value: FieldValue) => void;
  onSubnetTypeChange: (type: SubnetType) => void;
  t: typeof UI_TEXT["en"];
};

export function SubnetInspectorPanel({
  node,
  containerFields,
  onContainerFieldChange,
  onSubnetTypeChange,
  t,
}: SubnetInspectorPanelProps) {
  const subnetType =
    ((node.data as Partial<SubnetNodeData>).subnetType ?? "Public") as SubnetType;

  return (
    <div className="space-y-4 text-sm">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.type}
        <Select
          value={subnetType}
          onValueChange={(value) => onSubnetTypeChange(value as SubnetType)}
        >
          <SelectTrigger className="font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Public">{t.public}</SelectItem>
            <SelectItem value="Private">{t.private}</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.cidrBlock}
        <Input
          value={String(containerFields.cidrBlock ?? "")}
          placeholder={t.subnetCidrBlockPlaceholder}
          onChange={(event) =>
            onContainerFieldChange("cidrBlock", event.target.value)
          }
        />
      </label>
    </div>
  );
}
