import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { updateSyncedNodeGroup } from "@/lib/az-sync";
import { type FieldValue } from "@/lib/node-utils";
import { useFlowStore } from "@/store/flowStore";
import type {
  AppNode,
  NetworkContainerNodeData,
  SubnetNodeData,
  SubnetType,
} from "@/types/flow";

type SubnetInspectorPanelProps = {
  node: AppNode;
};

export function SubnetInspectorPanel({ node }: SubnetInspectorPanelProps) {
  const { setNodes } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const data = node.data as Partial<SubnetNodeData>;
  const subnetType = (data.subnetType ?? "Public") as SubnetType;
  const containerFields = (node.data as NetworkContainerNodeData).fields ?? {};

  const onSubnetTypeChange = useCallback(
    (nextType: SubnetType) => {
      const typeLabel = nextType === "Public" ? t.public : t.private;
      setNodes((nodes) =>
        updateSyncedNodeGroup(node.id, nodes, (n) => {
          const currentLabel = String(
            (n.data as Partial<SubnetNodeData>).label ?? "",
          );
          const labelIndex = Number(currentLabel.match(/\d+$/)?.[0] ?? 1);
          return {
            ...n,
            data: {
              ...n.data,
              label: t.subnetLabel(typeLabel, labelIndex),
              subnetType: nextType,
            },
          };
        }),
      );
    },
    [setNodes, node.id, t],
  );

  const onContainerFieldChange = useCallback(
    (fieldKey: string, value: FieldValue) => {
      setNodes((nodes) =>
        updateSyncedNodeGroup(node.id, nodes, (n) => {
          return {
            ...n,
            data: {
              ...n.data,
              fields: {
                ...(n.data as { fields?: Record<string, FieldValue> }).fields,
                [fieldKey]: value,
              },
            },
          };
        }),
      );
    },
    [setNodes, node.id],
  );

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
