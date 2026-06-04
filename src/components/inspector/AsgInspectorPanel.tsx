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
import { type FieldValue } from "@/lib/node-utils";
import { useFlowStore } from "@/store/flowStore";
import type { AppNode, NetworkContainerNodeData } from "@/types/flow";

type AsgInspectorPanelProps = {
  node: AppNode;
};

export function AsgInspectorPanel({ node }: AsgInspectorPanelProps) {
  const { setNodes } = useFlowStore();
  const t = UI_TEXT[getBrowserLocale()] as typeof UI_TEXT["en"];

  const fields = (node.data as NetworkContainerNodeData).fields ?? {};

  const onFieldChange = useCallback(
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

  return (
    <div className="space-y-4 text-sm">
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.asgMinCapacity}
        <Input
          type="number"
          min={0}
          value={String(fields.minCapacity ?? 1)}
          onChange={(e) => onFieldChange("minCapacity", Number(e.target.value))}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.asgDesiredCapacity}
        <Input
          type="number"
          min={0}
          value={String(fields.desiredCapacity ?? 2)}
          onChange={(e) =>
            onFieldChange("desiredCapacity", Number(e.target.value))
          }
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.asgMaxCapacity}
        <Input
          type="number"
          min={1}
          value={String(fields.maxCapacity ?? 4)}
          onChange={(e) => onFieldChange("maxCapacity", Number(e.target.value))}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.asgScalingPolicyType}
        <Select
          value={String(fields.scalingPolicyType ?? "target-tracking")}
          onValueChange={(v) => onFieldChange("scalingPolicyType", v)}
        >
          <SelectTrigger className="font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="target-tracking">Target Tracking</SelectItem>
            <SelectItem value="step-scaling">Step Scaling</SelectItem>
            <SelectItem value="simple-scaling">Simple Scaling</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.asgHealthCheckType}
        <Select
          value={String(fields.healthCheckType ?? "EC2")}
          onValueChange={(v) => onFieldChange("healthCheckType", v)}
        >
          <SelectTrigger className="font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EC2">EC2</SelectItem>
            <SelectItem value="ELB">ELB</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-foreground">
        {t.asgCooldownSeconds}
        <Input
          type="number"
          min={0}
          value={String(fields.cooldownSeconds ?? 300)}
          onChange={(e) =>
            onFieldChange("cooldownSeconds", Number(e.target.value))
          }
        />
      </label>
    </div>
  );
}
