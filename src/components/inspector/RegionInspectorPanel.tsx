import { useCallback } from "react";
import ChildCountSlider from "@/components/network-containers/ChildCountSlider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { getNetworkContainerType } from "@/lib/graph-utils";
import { setManagedChildCount } from "@/lib/network-topology/managed-children";
import { useFlowStore } from "@/store/flowStore";
import type { AppNode, NetworkContainerNodeData } from "@/types/flow";

type RegionInspectorPanelProps = {
  node: AppNode;
};

export function RegionInspectorPanel({ node }: RegionInspectorPanelProps) {
  const { nodes, setNodes, commitGraphChange } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const containerFields = (node.data as NetworkContainerNodeData).fields ?? {};
  const currentRegion = (containerFields.region as string) ?? "us-east-1";
  const childVpcCount = nodes.filter(
    (n) => n.parentId === node.id && getNetworkContainerType(n) === "vpc",
  ).length;

  const onRegionChange = useCallback(
    (region: string) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: `${t.region} ${region}`,
                  fields: {
                    ...(n.data as { fields?: Record<string, unknown> }).fields,
                    region,
                  },
                },
              }
            : n,
        ),
      );
    },
    [setNodes, node.id, t.region],
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
        value={childVpcCount}
        onChange={onChildCountChange}
      />
    </div>
  );
}
