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
import ChildCountSlider from "@/components/ChildCountSlider";
import EdgeArrowDirectionOption from "@/components/EdgeArrowDirectionOption";
import { getNodeFields } from "@/data/aws-service-fields";
import {
  getEdgeArrowDirection,
  setEdgeArrowDirection,
  type EdgeArrowDirection,
} from "@/lib/edge-tools";
import type { SubnetNodeData, SubnetType, NetworkContainerNodeData } from "@/types/flow";
import { UI_TEXT, getBrowserLocale, getLocalizedField } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import {
  isSubnetNode,
  isNetworkContainerNode,
  isVpcNode,
  buildAzNodes,
  buildVpcNodes,
  buildSubnetNodes,
  orderNodesForSubflows,
  isAzNode,
  getAbsolutePosition,
  getNodeSize,
} from "@/lib/graph-utils";
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

  const onRegionChange = useCallback(
    (nodeId: string, region: string) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: `${t.region} ${region}`,
                  fields: {
                    ...(node.data as { fields?: Record<string, unknown> }).fields,
                    region,
                  },
                },
              }
            : node,
        ),
      );
    },
    [setNodes, t.region],
  );

  const onNumberOfVPCsChange = useCallback(
    (nodeId: string, count: number) => {
      setNodes((prevNodes) => {
        const region = prevNodes.find((n) => n.id === nodeId);
        if (!region) return prevNodes;

        const { width: regionW, height: regionH } = getNodeSize(region);

        const managedVpcs = prevNodes.filter(
          (n) =>
            n.parentId === region.id && isVpcNode(n) && n.draggable === false,
        );

        const withoutVpcs = prevNodes.filter(
          (n) =>
            !(n.parentId === region.id && isVpcNode(n) && n.draggable === false),
        );

        const removedVpcIds = new Set(managedVpcs.map((n) => n.id));
        const nodesById = new Map(prevNodes.map((n) => [n.id, n]));
        const regionAbsPos = getAbsolutePosition(region, nodesById);

        // Re-parent orphaned children of removed managed VPCs to the Region
        const reParentedNodes = withoutVpcs.map((n) => {
          if (!n.parentId || !removedVpcIds.has(n.parentId)) return n;
          const vpcAbsPos = getAbsolutePosition(
            nodesById.get(n.parentId)!,
            nodesById,
          );
          return {
            ...n,
            parentId: region.id,
            position: {
              x: vpcAbsPos.x + n.position.x - regionAbsPos.x,
              y: vpcAbsPos.y + n.position.y - regionAbsPos.y,
            },
          };
        });

        const updatedRegion = {
          ...region,
          data: {
            ...region.data,
            fields: {
              ...(region.data as { fields?: Record<string, unknown> }).fields,
              numberOfVPCs: count,
            },
          },
        };

        const withUpdatedRegion = reParentedNodes.map((n) =>
          n.id === region.id ? updatedRegion : n,
        );

        if (count <= 0) {
          return withUpdatedRegion;
        }

        const vpcNodes = buildVpcNodes(region.id, regionW, regionH, count);
        return orderNodesForSubflows([...withUpdatedRegion, ...vpcNodes]);
      });
    },
    [setNodes],
  );

  const onNumberOfAZsChange = useCallback(
    (nodeId: string, count: number) => {
      setNodes((prevNodes) => {
        const vpc = prevNodes.find((n) => n.id === nodeId);
        if (!vpc) return prevNodes;

        const { width: vpcW, height: vpcH } = getNodeSize(vpc);

        const managedAzs = prevNodes.filter(
          (n) => n.parentId === vpc.id && isAzNode(n) && n.draggable === false,
        );

        const withoutAzs = prevNodes.filter(
          (n) => !(n.parentId === vpc.id && isAzNode(n) && n.draggable === false),
        );

        const removedAzIds = new Set(managedAzs.map((n) => n.id));
        const nodesById = new Map(prevNodes.map((n) => [n.id, n]));
        const vpcAbsPos = getAbsolutePosition(vpc, nodesById);

        // Re-parent orphaned children of removed managed AZs to the VPC
        const reParentedNodes = withoutAzs.map((n) => {
          if (!n.parentId || !removedAzIds.has(n.parentId)) return n;
          const azAbsPos = getAbsolutePosition(
            nodesById.get(n.parentId)!,
            nodesById,
          );
          return {
            ...n,
            parentId: vpc.id,
            position: {
              x: azAbsPos.x + n.position.x - vpcAbsPos.x,
              y: azAbsPos.y + n.position.y - vpcAbsPos.y,
            },
          };
        });

        const updatedVpc = {
          ...vpc,
          data: {
            ...vpc.data,
            fields: {
              ...(vpc.data as { fields?: Record<string, unknown> }).fields,
              numberOfAZs: count,
            },
          },
        };

        const withUpdatedVpc = reParentedNodes.map((n) =>
          n.id === vpc.id ? updatedVpc : n,
        );

        if (count <= 0) {
          return withUpdatedVpc;
        }

        const azNodes = buildAzNodes(vpc.id, vpcW, vpcH, count);
        return orderNodesForSubflows([...withUpdatedVpc, ...azNodes]);
      });
    },
    [setNodes],
  );

  const onNumberOfSubnetsChange = useCallback(
    (nodeId: string, count: number) => {
      setNodes((prevNodes) => {
        const az = prevNodes.find((n) => n.id === nodeId);
        if (!az) return prevNodes;

        const { width: azW, height: azH } = getNodeSize(az);

        const managedSubnets = prevNodes.filter(
          (n) => n.parentId === az.id && isSubnetNode(n) && n.draggable === false,
        );

        const withoutSubnets = prevNodes.filter(
          (n) => !(n.parentId === az.id && isSubnetNode(n) && n.draggable === false),
        );

        const removedSubnetIds = new Set(managedSubnets.map((n) => n.id));
        const nodesById = new Map(prevNodes.map((n) => [n.id, n]));
        const azAbsPos = getAbsolutePosition(az, nodesById);

        const reParentedNodes = withoutSubnets.map((n) => {
          if (!n.parentId || !removedSubnetIds.has(n.parentId)) return n;
          const subnetAbsPos = getAbsolutePosition(nodesById.get(n.parentId)!, nodesById);
          return {
            ...n,
            parentId: az.id,
            position: {
              x: subnetAbsPos.x + n.position.x - azAbsPos.x,
              y: subnetAbsPos.y + n.position.y - azAbsPos.y,
            },
          };
        });

        const updatedAz = {
          ...az,
          data: {
            ...az.data,
            fields: {
              ...(az.data as { fields?: Record<string, unknown> }).fields,
              numberOfSubnets: count,
            },
          },
        };

        const withUpdatedAz = reParentedNodes.map((n) => (n.id === az.id ? updatedAz : n));

        if (count <= 0) {
          return withUpdatedAz;
        }

        const subnetNodes = buildSubnetNodes(az.id, azW, azH, count);
        return orderNodesForSubflows([...withUpdatedAz, ...subnetNodes]);
      });
    },
    [setNodes],
  );

  const onServiceFieldChange = useCallback(
    (nodeId: string, fieldKey: string, value: FieldValue) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }

          const data = node.data as { fields?: Record<string, FieldValue> };

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

  const onEdgeLabelChange = useCallback(    (edgeId: string, label: string) => {
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
  const selectedIsRegion = selectedNode
    ? isNetworkContainerNode(selectedNode) &&
      (selectedNode.data as Partial<NetworkContainerNodeData>).containerType ===
        "region"
    : false;
  const selectedIsVpc = selectedNode
    ? isNetworkContainerNode(selectedNode) &&
      (selectedNode.data as Partial<NetworkContainerNodeData>).containerType ===
        "vpc"
    : false;
  const selectedIsAz = selectedNode
    ? isNetworkContainerNode(selectedNode) &&
      (selectedNode.data as Partial<NetworkContainerNodeData>).containerType ===
        "az"
    : false;
  const selectedAwsNode =
    selectedNode?.type === "awsService"
      ? (selectedNode as AwsServiceNodeType)
      : null;
  const selectedNodeFieldsKey = selectedAwsNode
    ? getServiceId(selectedAwsNode)
    : (selectedNode?.type ?? "");
  const selectedNodeFields = getNodeFields(selectedNodeFieldsKey);
  const selectedHasFields = selectedNodeFields.length > 0;
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
          : "";

  // Calculate dynamic child counts
  const childVpcCount = selectedNode
    ? nodes.filter((n) => n.parentId === selectedNode.id && isVpcNode(n)).length
    : 0;

  const childAzCount = selectedNode
    ? nodes.filter((n) => n.parentId === selectedNode.id && isAzNode(n)).length
    : 0;

  const childSubnetCount = selectedNode
    ? nodes.filter((n) => n.parentId === selectedNode.id && isSubnetNode(n)).length
    : 0;

  return (
    <Card className="flex h-full w-72 flex-col rounded-none border-y-0 border-r-0">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {!selectedNode && selectedEdge ? (
            <>
              {t.edge}
              <br />
              <span className="font-normal text-muted-foreground">
                {selectedEdge.source} → {selectedEdge.target}
              </span>
            </>
          ) : selectedNode || selectedEdge ? selectedLabel : t.noNodeSelected}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-0.5">
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
          ) : selectedNode && selectedIsRegion ? (
            <div className="space-y-4 text-sm">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                {t.region}
                <Select
                  value={
                    ((selectedNode.data as Partial<NetworkContainerNodeData> & {
                      fields?: Record<string, unknown>;
                    })?.fields?.region as string) ?? "us-east-1"
                  }
                  onValueChange={(value) => onRegionChange(selectedNode.id, value)}
                >
                  <SelectTrigger className="font-normal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">
                      US East (N. Virginia)
                    </SelectItem>
                    <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                    <SelectItem value="us-west-1">
                      US West (N. California)
                    </SelectItem>
                    <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                    <SelectItem value="eu-west-1">
                      Europe (Ireland)
                    </SelectItem>
                    <SelectItem value="eu-west-2">Europe (London)</SelectItem>
                    <SelectItem value="eu-central-1">
                      Europe (Frankfurt)
                    </SelectItem>
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
                onChange={(value) => onNumberOfVPCsChange(selectedNode.id, value)}
              />
            </div>
          ) : selectedNode && selectedIsVpc ? (
            <div className="space-y-4 text-sm">
              <ChildCountSlider
                label={t.numberOfAZs}
                value={childAzCount}
                onChange={(value) => onNumberOfAZsChange(selectedNode.id, value)}
              />
            </div>
          ) : selectedNode && selectedIsAz ? (
            <div className="space-y-4 text-sm">
              <ChildCountSlider
                label={t.numberOfSubnets}
                value={childSubnetCount}
                onChange={(value) =>
                  onNumberOfSubnetsChange(selectedNode.id, value)
                }
              />
            </div>
          ) : selectedNode && selectedHasFields ? (
            <div className="space-y-4">
              {selectedNodeFields.map((field) => {
                const localizedField = getLocalizedField(
                  selectedNodeFieldsKey,
                  field,
                  locale,
                );
                const value = getFieldValue(
                  selectedNode.data as AwsServiceNodeData,
                  field,
                );

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
                            selectedNode.id,
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
                            selectedNode.id,
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
                          selectedNode.id,
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
