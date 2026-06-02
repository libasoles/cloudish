import { useCallback } from "react";
import ChildCountSlider from "@/components/ChildCountSlider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { isSubnetNode } from "@/lib/graph-utils";
import { setManagedChildCount } from "@/lib/network-topology/managed-children";
import { useFlowStore } from "@/store/flowStore";
import type { AppNode } from "@/types/flow";

type AzInspectorPanelProps = {
  node: AppNode;
};

export function AzInspectorPanel({ node }: AzInspectorPanelProps) {
  const { nodes, commitGraphChange, toggleAzSync } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const childSubnetCount = nodes.filter(
    (n) => n.parentId === node.id && isSubnetNode(n),
  ).length;
  const azHasSiblings =
    node.parentId != null &&
    nodes.filter(
      (n) =>
        n.parentId === node.parentId &&
        (n.data as { containerType?: string }).containerType === "az",
    ).length > 1;
  const azSynced = Boolean((node.data as { synced?: boolean }).synced);

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
      <ChildCountSlider
        label={t.numberOfSubnets}
        value={childSubnetCount}
        onChange={onChildCountChange}
      />
      {azHasSiblings && (
        <>
          <label className="flex items-center gap-3 px-1 py-2 font-medium text-foreground mb-0">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={azSynced}
              onChange={(e) => toggleAzSync(node.id, e.target.checked)}
            />
            <span>{t.syncAzs}</span>
          </label>
          <Alert>
            <AlertDescription>{t.syncAzsBannerDescription}</AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
