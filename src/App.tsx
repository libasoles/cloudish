import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type OnConnect,
  type NodeTypes,
  type OnNodeDrag,
  type ReactFlowInstance,
  type Rect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
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
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import AwsServiceNode, {
  type AwsServiceNodeType,
  type AwsServiceNodeData,
} from "@/components/AwsServiceNode";
import EdgeArrowDirectionOption from "@/components/EdgeArrowDirectionOption";
import NetworkContainerNode from "@/components/NetworkContainerNode";
import DragDropSidebar from "@/components/DragDropSidebar";
import ServiceSearch from "@/components/ServiceSearch";
import { AWS_SERVICES, type AwsService } from "@/data/aws-services";
import {
  AWS_SERVICE_FIELDS,
  type ServiceField,
} from "@/data/aws-service-fields";
import { initialEdges, initialNodes } from "@/data/initial-flow";
import {
  AWS_SERVICE_NODE_TYPE,
  DND_MIME_TYPE,
  decodeDragTool,
} from "@/lib/drag-tools";
import {
  getEdgeArrowDirection,
  setEdgeArrowDirection,
  type EdgeArrowDirection,
} from "@/lib/edge-tools";
import type {
  AppEdge,
  AppNode,
  FlowPosition,
  NetworkContainerNodeData,
  SubnetNodeData,
  SubnetType,
} from "@/types/flow";
import {
  UI_TEXT,
  getBrowserLocale,
  getLocalizedField,
  getServiceDescription as getLocalizedServiceDescription,
} from "@/i18n";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
  networkContainer: NetworkContainerNode,
};

type FieldValue = string | boolean | number;

const CONTAINER_WIDTH = 320;
const CONTAINER_HEIGHT = 220;
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 40;
const SERVICE_DROP_OFFSET = { x: 50, y: 36 };
const INITIAL_FIT_VIEW_PADDING = 1.3;
const VPC_SERVICE_ID = "vpc";

function getContainerStyle() {
  return {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
  };
}

function isNetworkContainerNode(node: AppNode) {
  return node.type === "networkContainer";
}

function isSubnetNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "subnet"
  );
}

function isVpcNode(node: AppNode) {
  return (
    isNetworkContainerNode(node) &&
    (node.data as NetworkContainerNodeData).containerType === "vpc"
  );
}

function orderNodesForSubflows(nodes: AppNode[]) {
  return [...nodes].sort((a, b) => {
    if (isNetworkContainerNode(a) === isNetworkContainerNode(b)) {
      if (isVpcNode(a) !== isVpcNode(b)) {
        return isVpcNode(a) ? -1 : 1;
      }

      return 0;
    }

    return isNetworkContainerNode(a) ? -1 : 1;
  });
}

function getNodeSize(node: AppNode) {
  return {
    width: node.width ?? node.measured?.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? node.measured?.height ?? DEFAULT_NODE_HEIGHT,
  };
}

function getAbsolutePosition(
  node: AppNode,
  nodesById: Map<string, AppNode>,
): FlowPosition {
  if (!node.parentId) {
    return node.position;
  }

  const parentNode = nodesById.get(node.parentId);
  if (!parentNode) {
    return node.position;
  }

  const parentPosition = getAbsolutePosition(parentNode, nodesById);

  return {
    x: parentPosition.x + node.position.x,
    y: parentPosition.y + node.position.y,
  };
}

function getNodeRect(node: AppNode, nodesById: Map<string, AppNode>): Rect {
  return {
    ...getAbsolutePosition(node, nodesById),
    ...getNodeSize(node),
  };
}

function isRectIntersecting(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function findIntersectingContainer(
  nodeRect: Rect,
  nodes: AppNode[],
  nodesById: Map<string, AppNode>,
  childNode?: AppNode,
) {
  return nodes
    .filter((node) => {
      if (!isNetworkContainerNode(node) || node.id === childNode?.id) {
        return false;
      }

      if (childNode && isVpcNode(childNode)) {
        return false;
      }

      if (childNode && isSubnetNode(childNode) && !isVpcNode(node)) {
        return false;
      }

      return isRectIntersecting(nodeRect, getNodeRect(node, nodesById));
    })
    .sort((a, b) => {
      if (isSubnetNode(a) !== isSubnetNode(b)) {
        return isSubnetNode(a) ? -1 : 1;
      }

      return 0;
    })[0];
}

function getServiceId(node: AwsServiceNodeType) {
  return node.data.serviceId ?? node.id;
}

function getServiceDescription(
  node: AwsServiceNodeType,
  locale: ReturnType<typeof getBrowserLocale>,
) {
  const serviceId = getServiceId(node);
  const service = AWS_SERVICES.find(
    (service) => service.id === serviceId || service.slug === node.data.slug,
  );

  return getLocalizedServiceDescription(service, locale, node.data.description);
}

function getFieldValue(
  data: AwsServiceNodeData,
  field: ServiceField,
): FieldValue {
  return data.fields?.[field.key] ?? field.defaultValue ?? "";
}

function getAwsServiceNodeData(service: AwsService): AwsServiceNodeData {
  return {
    name: service.name,
    slug: service.slug,
    category: service.category,
    serviceId: service.id,
  };
}

function getParentedPosition(
  position: FlowPosition,
  size: { width: number; height: number },
  nodes: AppNode[],
) {
  const nodeRect = { ...position, ...size };
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const parentNode = findIntersectingContainer(nodeRect, nodes, nodesById);

  if (!parentNode) {
    return { position };
  }

  const parentPosition = getAbsolutePosition(parentNode, nodesById);

  return {
    parentId: parentNode.id,
    position: {
      x: position.x - parentPosition.x,
      y: position.y - parentPosition.y,
    },
  };
}

export default function App() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initialEdges);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    AppNode,
    AppEdge
  > | null>(null);
  const containerIdRef = useRef(1);
  const serviceIdRef = useRef(1);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const droppedTool = decodeDragTool(
        event.dataTransfer.getData(DND_MIME_TYPE),
      );
      if (!droppedTool || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (droppedTool.type === AWS_SERVICE_NODE_TYPE) {
        const service = AWS_SERVICES.find(
          (service) => service.id === droppedTool.serviceId,
        );

        if (!service) {
          return;
        }

        if (service.id === VPC_SERVICE_ID) {
          const containerNumber = containerIdRef.current++;
          const vpcPosition = {
            x: position.x - CONTAINER_WIDTH / 2,
            y: position.y - CONTAINER_HEIGHT / 2,
          };
          const vpcRect = {
            ...vpcPosition,
            width: CONTAINER_WIDTH,
            height: CONTAINER_HEIGHT,
          };
          const vpcId = `vpc-${containerNumber}`;

          setNodes((nodes) => {
            const nodesById = new Map(nodes.map((node) => [node.id, node]));

            return orderNodesForSubflows([
              ...nodes.map((node) => {
                if (isVpcNode(node)) {
                  return node;
                }

                const nodeRect = getNodeRect(node, nodesById);

                if (!isRectIntersecting(nodeRect, vpcRect)) {
                  return node;
                }

                return {
                  ...node,
                  parentId: vpcId,
                  position: {
                    x: nodeRect.x - vpcPosition.x,
                    y: nodeRect.y - vpcPosition.y,
                  },
                };
              }),
              {
                id: vpcId,
                type: "networkContainer",
                position: vpcPosition,
                data: { containerType: "vpc", label: "VPC" },
                style: getContainerStyle(),
              },
            ]);
          });
          return;
        }

        const nodeId = `${service.id}-${serviceIdRef.current++}`;
        const nodePosition = {
          x: position.x - SERVICE_DROP_OFFSET.x,
          y: position.y - SERVICE_DROP_OFFSET.y,
        };

        setNodes((nodes) => {
          const parentedPosition = getParentedPosition(
            nodePosition,
            {
              width: DEFAULT_NODE_WIDTH,
              height: DEFAULT_NODE_HEIGHT,
            },
            nodes,
          );

          return orderNodesForSubflows([
            ...nodes,
            {
              id: nodeId,
              type: AWS_SERVICE_NODE_TYPE,
              ...parentedPosition,
              data: getAwsServiceNodeData(service),
            },
          ]);
        });
        return;
      }

      const containerNumber = containerIdRef.current++;
      const subnetPosition = {
        x: position.x - CONTAINER_WIDTH / 2,
        y: position.y - CONTAINER_HEIGHT / 2,
      };
      const subnetRect = {
        ...subnetPosition,
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
      };
      const subnetId = `container-${containerNumber}`;

      setNodes((nodes) => {
        const nodesById = new Map(nodes.map((node) => [node.id, node]));
        const parentVpc = findIntersectingContainer(
          subnetRect,
          nodes,
          nodesById,
          {
            id: subnetId,
            type: "networkContainer",
            position: subnetPosition,
            data: {
              containerType: "subnet",
              label: t.public,
              subnetType: "Public",
            },
          },
        );
        const parentVpcPosition = parentVpc
          ? getAbsolutePosition(parentVpc, nodesById)
          : null;

        return orderNodesForSubflows([
          ...nodes.map((node) => {
            if (isNetworkContainerNode(node)) {
              return node;
            }

            const nodeRect = getNodeRect(node, nodesById);

            if (!isRectIntersecting(nodeRect, subnetRect)) {
              return node;
            }

            return {
              ...node,
              parentId: subnetId,
              position: {
                x: nodeRect.x - subnetPosition.x,
                y: nodeRect.y - subnetPosition.y,
              },
            };
          }),
          {
            id: subnetId,
            type: "networkContainer",
            parentId: parentVpc?.id,
            position: parentVpcPosition
              ? {
                  x: subnetPosition.x - parentVpcPosition.x,
                  y: subnetPosition.y - parentVpcPosition.y,
                }
              : subnetPosition,
            data: {
              containerType: "subnet",
              label: t.public,
              subnetType: "Public",
            },
            style: getContainerStyle(),
          },
        ]);
      });
    },
    [reactFlowInstance, setNodes, t.public],
  );

  const syncNodeSubnet = useCallback(
    (draggedNodeId: string) => {
      setNodes((nodes) => {
        const nodesById = new Map(nodes.map((node) => [node.id, node]));
        const draggedNode = nodesById.get(draggedNodeId);

        if (!draggedNode) {
          return nodes;
        }

        const containerNodes = nodes.filter(isNetworkContainerNode);
        const updates = new Map<string, AppNode>();

        function getUpdatedNode(node: AppNode) {
          return updates.get(node.id) ?? node;
        }

        function updateContainerForNode(
          node: AppNode,
          forcedContainer?: AppNode,
        ) {
          if (isVpcNode(node)) {
            return;
          }

          const nodeRect = getNodeRect(node, nodesById);
          const containerNode =
            forcedContainer ??
            findIntersectingContainer(
              nodeRect,
              containerNodes,
              nodesById,
              node,
            );

          if (!containerNode) {
            if (!node.parentId) {
              return;
            }

            updates.set(node.id, {
              ...node,
              parentId: undefined,
              position: {
                x: nodeRect.x,
                y: nodeRect.y,
              },
            });
            return;
          }

          if (node.parentId === containerNode.id) {
            return;
          }

          const containerPosition = getAbsolutePosition(
            containerNode,
            nodesById,
          );

          updates.set(node.id, {
            ...node,
            parentId: containerNode.id,
            position: {
              x: nodeRect.x - containerPosition.x,
              y: nodeRect.y - containerPosition.y,
            },
          });
        }

        if (isNetworkContainerNode(draggedNode)) {
          const draggedContainerRect = getNodeRect(draggedNode, nodesById);

          nodes.forEach((node) => {
            if (node.id === draggedNode.id || isVpcNode(node)) {
              return;
            }

            const currentNode = getUpdatedNode(node);
            const nodeRect = getNodeRect(currentNode, nodesById);

            if (isRectIntersecting(nodeRect, draggedContainerRect)) {
              updateContainerForNode(currentNode, draggedNode);
            }
          });
        } else {
          updateContainerForNode(draggedNode);
        }

        if (updates.size === 0) {
          return nodes;
        }

        return orderNodesForSubflows(
          nodes.map((node) => updates.get(node.id) ?? node),
        );
      });
    },
    [setNodes],
  );

  const onNodeDragStop: OnNodeDrag<AppNode> = useCallback(
    (_event, node) => {
      syncNodeSubnet(node.id);
    },
    [syncNodeSubnet],
  );

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
    <div
      className="bg-background text-foreground"
      style={{ display: "flex", width: "100vw", height: "100vh" }}
    >
      <DragDropSidebar
        labels={{
          dragAndDrop: t.dragAndDrop,
          dragSubnet: t.dragSubnet,
          subnet: t.subnet,
          dragService: t.dragService,
        }}
      />
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          className="dark"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onInit={setReactFlowInstance}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: INITIAL_FIT_VIEW_PADDING }}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <ServiceSearch />
        </ReactFlow>
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInspectorOpen((v) => !v)}
            aria-label={inspectorOpen ? t.closeInspector : t.openInspector}
          >
            {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
      </div>

      {inspectorOpen && (
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
                            label={
                              edgeArrowDirectionLabels[
                                selectedEdgeArrowDirection
                              ]
                            }
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
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
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
      )}
    </div>
  );
}
