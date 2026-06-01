import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AwsServiceNodeType,
  type AwsServiceNodeData,
} from "@/components/AwsServiceNode";
import EdgeArrowDirectionOption from "@/components/EdgeArrowDirectionOption";
import { AWS_SERVICE_FIELDS } from "@/data/aws-service-fields";
import {
  getEdgeArrowDirection,
  setEdgeArrowDirection,
  type EdgeArrowDirection,
} from "@/lib/edge-tools";
import type { SubnetNodeData, SubnetType } from "@/types/flow";
import { UI_TEXT, getBrowserLocale, getLocalizedField } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { isSubnetNode } from "@/lib/graph-utils";
import {
  getServiceId,
  getServiceDescription,
  getFieldValue,
  type FieldValue,
} from "@/lib/node-utils";

export default function Inspector() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];
  const { nodes, edges, inspectorOpen, setNodes, setEdges } = useFlowStore();

  const onSubnetTypeChange = useCallback(
    (nodeId: string, subnetType: SubnetType) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: subnetType === "Public" ? t.public : t.private,
                  subnetType,
                },
              }
            : node,
        ),
      );
    },
    [setNodes, t.private, t.public],
  );

  const onServiceFieldChange = useCallback(
    (nodeId: string, fieldKey: string, value: FieldValue) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId || node.type !== "awsService") {
            return node;
          }

          const data = node.data as AwsServiceNodeData;

          return {
            ...node,
            data: {
              ...data,
              fields: {
                ...data.fields,
                [fieldKey]: value,
              },
            },
          };
        }),
      );
    },
    [setNodes],
  );

  const onEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      setEdges((edges) =>
        edges.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge)),
      );
    },
    [setEdges],
  );

  const onEdgeArrowDirectionChange = useCallback(
    (edgeId: string, direction: EdgeArrowDirection) => {
      setEdges((edges) =>
        edges.map((edge) =>
          edge.id === edgeId ? setEdgeArrowDirection(edge, direction) : edge,
        ),
      );
    },
    [setEdges],
  );

  if (!inspectorOpen) {
    return null;
  }

  const selectedNode = nodes.find((n) => n.selected);
  const selectedEdge = edges.find((edge) => edge.selected);
  const selectedEdgeArrowDirection = selectedEdge
    ? getEdgeArrowDirection(selectedEdge)
    : "none";
  const edgeArrowDirectionLabels: Record<EdgeArrowDirection, string> = {
    none: t.noArrows,
    source: t.sourceArrow,
    target: t.targetArrow,
    both: t.bothArrows,
  };
  const selectedIsSubnet = selectedNode ? isSubnetNode(selectedNode) : false;
  const selectedAwsNode =
    selectedNode?.type === "awsService"
      ? (selectedNode as AwsServiceNodeType)
      : null;
  const selectedAwsFields = selectedAwsNode
    ? (AWS_SERVICE_FIELDS[getServiceId(selectedAwsNode)] ?? [])
    : [];
  const selectedHasFields = selectedAwsFields.length > 0;
  const selectedAwsDescription = selectedAwsNode
    ? getServiceDescription(selectedAwsNode, locale)
    : "";

  const selectedLabel =
    selectedNode?.type === "awsService"
      ? (selectedNode.data as AwsServiceNodeData).name
      : selectedIsSubnet
        ? t.subnet
        : selectedNode
          ? String((selectedNode.data as { label?: unknown })?.label ?? "")
          : selectedEdge
            ? `${t.edge}: ${selectedEdge.source} -> ${selectedEdge.target}`
            : "";

  return (
    <Card className="flex h-full w-72 flex-col rounded-none border-y-0 border-r-0">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {selectedNode || selectedEdge ? selectedLabel : t.noNodeSelected}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {!selectedNode && selectedEdge ? (
            <div className="space-y-4 text-sm">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                {t.label}
                <Input
                  value={String(selectedEdge.label ?? "")}
                  onChange={(event) =>
                    onEdgeLabelChange(selectedEdge.id, event.target.value)
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                {t.arrowDirection}
                <Select
                  value={selectedEdgeArrowDirection}
                  onValueChange={(value) =>
                    onEdgeArrowDirectionChange(
                      selectedEdge.id,
                      value as EdgeArrowDirection,
                    )
                  }
                >
                  <SelectTrigger className="font-normal">
                    <SelectValue>
                      <EdgeArrowDirectionOption
                        direction={selectedEdgeArrowDirection}
                        label={edgeArrowDirectionLabels[selectedEdgeArrowDirection]}
                      />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <EdgeArrowDirectionOption
                        direction="none"
                        label={t.noArrows}
                      />
                    </SelectItem>
                    <SelectItem value="source">
                      <EdgeArrowDirectionOption
                        direction="source"
                        label={t.sourceArrow}
                      />
                    </SelectItem>
                    <SelectItem value="target">
                      <EdgeArrowDirectionOption
                        direction="target"
                        label={t.targetArrow}
                      />
                    </SelectItem>
                    <SelectItem value="both">
                      <EdgeArrowDirectionOption
                        direction="both"
                        label={t.bothArrows}
                      />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <div className="space-y-2 text-muted-foreground">
                <p>ID: {selectedEdge.id}</p>
                <p>{`${selectedEdge.source} -> ${selectedEdge.target}`}</p>
              </div>
            </div>
          ) : selectedNode && selectedIsSubnet ? (
            <div className="space-y-4 text-sm">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                {t.type}
                <Select
                  value={
                    ((selectedNode.data as Partial<SubnetNodeData>)
                      .subnetType ?? "Public") as SubnetType
                  }
                  onValueChange={(value) =>
                    onSubnetTypeChange(selectedNode.id, value as SubnetType)
                  }
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
            </div>
          ) : selectedAwsNode && selectedHasFields ? (
            <div className="space-y-4">
              {selectedAwsFields.map((field) => {
                const localizedField = getLocalizedField(
                  getServiceId(selectedAwsNode),
                  field,
                  locale,
                );
                const value = getFieldValue(selectedAwsNode.data, field);

                if (field.type === "select") {
                  return (
                    <label
                      key={field.key}
                      className="grid gap-2 text-sm font-medium text-foreground"
                    >
                      {localizedField.label}
                      <Select
                        value={String(value)}
                        onValueChange={(nextValue) =>
                          onServiceFieldChange(
                            selectedAwsNode.id,
                            field.key,
                            nextValue,
                          )
                        }
                      >
                        <SelectTrigger className="font-normal">
                          <SelectValue
                            placeholder={localizedField.placeholder}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(localizedField.options ?? []).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  );
                }

                if (field.type === "boolean") {
                  return (
                    <label
                      key={field.key}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground"
                    >
                      <span>{localizedField.label}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          onServiceFieldChange(
                            selectedAwsNode.id,
                            field.key,
                            event.target.checked,
                          )
                        }
                      />
                    </label>
                  );
                }

                return (
                  <label
                    key={field.key}
                    className="grid gap-2 text-sm font-medium text-foreground"
                  >
                    {localizedField.label}
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      value={String(value)}
                      placeholder={localizedField.placeholder}
                      onChange={(event) => {
                        const nextValue =
                          field.type === "number"
                            ? event.target.value === ""
                              ? ""
                              : Number(event.target.value)
                            : event.target.value;

                        onServiceFieldChange(
                          selectedAwsNode.id,
                          field.key,
                          nextValue,
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>
          ) : selectedNode ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              {selectedAwsNode && (
                <Alert>
                  <AlertTitle>{t.comingSoon}</AlertTitle>
                  <AlertDescription>{t.fieldsUnavailable}</AlertDescription>
                </Alert>
              )}
              <p>ID: {selectedNode.id}</p>
              <p>
                {t.position}: ({Math.round(selectedNode.position.x)},{" "}
                {Math.round(selectedNode.position.y)})
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.clickNodeDetails}
            </p>
          )}
        </div>
        {selectedAwsNode && selectedAwsDescription && (
          <div className="mt-4 border-t border-border pt-4 text-sm leading-5 text-muted-foreground">
            {selectedAwsDescription}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
