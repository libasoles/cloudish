import { useCallback } from "react";
import ChildCountSlider from "@/components/ChildCountSlider";
import { Input } from "@/components/ui/input";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { type FieldValue } from "@/lib/node-utils";
import { getNetworkContainerType } from "@/lib/graph-utils";
import { setManagedChildCount } from "@/lib/network-topology/managed-children";
import { useFlowStore } from "@/store/flowStore";
import type { AppNode, NetworkContainerNodeData } from "@/types/flow";

type VpcInspectorPanelProps = {
  node: AppNode;
};

export function VpcInspectorPanel({ node }: VpcInspectorPanelProps) {
  const { nodes, setNodes, commitGraphChange } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const containerFields = (node.data as NetworkContainerNodeData).fields ?? {};
  const childAzCount = nodes.filter(
    (n) => n.parentId === node.id && getNetworkContainerType(n) === "az",
  ).length;

  const onContainerFieldChange = useCallback(
    (fieldKey: string, value: FieldValue) => {
      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id !== node.id) return n;
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

  const onChildCountChange = useCallback(
    (count: number) => {
      commitGraphChange((state) =>
        setManagedChildCount(node.id, count, state.nodes, state.edges, t.subnetLabel),
      );
    },
    [commitGraphChange, node.id, t.subnetLabel],
  );

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
        value={childAzCount}
        onChange={onChildCountChange}
      />
    </div>
  );
}
