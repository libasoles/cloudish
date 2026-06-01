import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type OnConnect,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type OnNodeDrag,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import DragDropSidebar from "@/components/DragDropSidebar";
import NewToolMenu from "@/components/NewToolMenu";
import AwsServiceNode from "@/components/AwsServiceNode";
import NetworkContainerNode from "@/components/NetworkContainerNode";
import UserNode from "@/components/UserNode";
import EditableEdge from "@/components/EditableEdge";
import ServiceSearch from "@/components/ServiceSearch";
import { AWS_SERVICES } from "@/data/aws-services";
import {
  AWS_SERVICE_NODE_TYPE,
  DND_MIME_TYPE,
  decodeDragTool,
  type DragTool,
} from "@/lib/drag-tools";
import type { AppEdge, AppNode } from "@/types/flow";
import { UI_TEXT, getBrowserLocale, getServiceDescription } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import {
  isNetworkContainerNode,
  isRegionNode,
  orderNodesForSubflows,
  getNodeRect,
  getNodeSize,
  getAbsolutePosition,
  isRectIntersecting,
  findIntersectingContainer,
  getParentedPosition,
  redistributeSubnetNodes,
  redistributeVpcNodes,
  redistributeChildContainers,
  getNetworkContainerType,
  REGION_STYLE,
  REGION_WIDTH,
  REGION_HEIGHT,
  VPC_STYLE,
  VPC_WIDTH,
  VPC_HEIGHT,
  AZ_STYLE,
  AZ_WIDTH,
  AZ_HEIGHT,
  CONTAINER_STYLE,
  CONTAINER_WIDTH,
  CONTAINER_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from "@/lib/graph-utils";
import {
  addEdgeWithAzSync,
  addNodeWithAzSync,
  syncNodeGroupPosition,
} from "@/lib/az-sync";
import { getAwsServiceNodeData } from "@/lib/node-utils";
import { EDGE_STYLE } from "@/lib/edge-tools";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
  networkContainer: NetworkContainerNode,
  user: UserNode,
};

const edgeTypes: EdgeTypes = {
  default: EditableEdge,
};

const SERVICE_DROP_OFFSET = { x: 50, y: 36 };
const INITIAL_FIT_VIEW_PADDING = 1.3;
const VPC_SERVICE_ID = "vpc";
const CLICK_PULSE_PREFIX = "sidebar-click";
const DEFAULT_EDGE_OPTIONS = {
  style: EDGE_STYLE,
};

export default function Canvas() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    commitGraphChange,
    inspectorOpen,
    setInspectorOpen,
    dropTargetNodeId,
    setDropTargetNodeId,
    setDropPreview,
    resetCanvas,
  } = useFlowStore();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    AppNode,
    AppEdge
  > | null>(null);
  const containerIdRef = useRef(1);
  const subnetIdRef = useRef(1);
  const serviceIdRef = useRef(1);
  const edgeIdRef = useRef(1);
  const pulseIdRef = useRef(1);
  const activeDragToolRef = useRef<DragTool | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInit = useCallback(
    (instance: ReactFlowInstance<AppNode, AppEdge>) => {
      setReactFlowInstance(instance);
      if (containerRef.current) {
        const canvasWidth = containerRef.current.clientWidth;
        const vp = instance.getViewport();
        instance.setViewport(
          { ...vp, x: vp.x - canvasWidth / 6 },
          { duration: 0 },
        );
      }
    },
    [setReactFlowInstance],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const edge: AppEdge = {
        ...connection,
        id: `edge-${edgeIdRef.current++}`,
        source: connection.source,
        target: connection.target,
        style: EDGE_STYLE,
      };

      commitGraphChange(({ nodes: n, edges }) => ({
        nodes: n,
        edges: addEdgeWithAzSync(edge, n, edges),
      }));
    },
    [commitGraphChange],
  );

  const onDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const droppedTool =
        decodeDragTool(event.dataTransfer.getData(DND_MIME_TYPE)) ??
        activeDragToolRef.current;

      if (!droppedTool || !reactFlowInstance) {
        setDropTargetNodeId(null);
        setDropPreview(null);
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const { nodes: currentNodes } = useFlowStore.getState();
      const nodesById = new Map(currentNodes.map((node) => [node.id, node]));

      if (
        droppedTool.type === AWS_SERVICE_NODE_TYPE &&
        droppedTool.serviceId === VPC_SERVICE_ID
      ) {
        const vpcPosition = {
          x: position.x - VPC_WIDTH / 2,
          y: position.y - VPC_HEIGHT / 2,
        };
        const target = findIntersectingContainer(
          { ...vpcPosition, width: VPC_WIDTH, height: VPC_HEIGHT },
          currentNodes,
          nodesById,
          {
            id: "drop-preview-vpc",
            type: "networkContainer",
            position: vpcPosition,
            data: { containerType: "vpc", label: "VPC" },
          },
        );

        setDropTargetNodeId(target?.id ?? null);
        setDropPreview(target ? { parentId: target.id, childType: "vpc" } : null);
        return;
      }

      if (droppedTool.type === "az") {
        const azPosition = {
          x: position.x - AZ_WIDTH / 2,
          y: position.y - AZ_HEIGHT / 2,
        };
        const target = findIntersectingContainer(
          { ...azPosition, width: AZ_WIDTH, height: AZ_HEIGHT },
          currentNodes,
          nodesById,
          {
            id: "drop-preview-az",
            type: "networkContainer",
            position: azPosition,
            data: { containerType: "az", label: t.availabilityZone },
          },
        );

        setDropTargetNodeId(target?.id ?? null);
        setDropPreview(target ? { parentId: target.id, childType: "az" } : null);
        return;
      }

      if (droppedTool.type === "container") {
        const subnetPosition = {
          x: position.x - CONTAINER_WIDTH / 2,
          y: position.y - CONTAINER_HEIGHT / 2,
        };
        const target = findIntersectingContainer(
          {
            ...subnetPosition,
            width: CONTAINER_WIDTH,
            height: CONTAINER_HEIGHT,
          },
          currentNodes,
          nodesById,
          {
            id: "drop-preview-subnet",
            type: "networkContainer",
            position: subnetPosition,
            data: { containerType: "subnet", label: t.subnet },
          },
        );

        setDropTargetNodeId(target?.id ?? null);
        setDropPreview(
          target ? { parentId: target.id, childType: "subnet" } : null,
        );
        return;
      }

      setDropTargetNodeId(null);
      setDropPreview(null);
    },
    [
      reactFlowInstance,
      setDropPreview,
      setDropTargetNodeId,
      t.availabilityZone,
      t.subnet,
    ],
  );

  const addToolAtPosition = useCallback(
    (
      tool: DragTool,
      position: { x: number; y: number },
      pulseKey?: string,
    ) => {
      const pulseData = pulseKey ? { pulseKey } : {};

      if (tool.type === AWS_SERVICE_NODE_TYPE) {
        const service = AWS_SERVICES.find(
          (service) => service.id === tool.serviceId,
        );

        if (!service) {
          return;
        }

        if (service.id === VPC_SERVICE_ID) {
          const containerNumber = containerIdRef.current++;
          const vpcPosition = {
            x: position.x - VPC_WIDTH / 2,
            y: position.y - VPC_HEIGHT / 2,
          };
          const vpcRect = {
            ...vpcPosition,
            width: VPC_WIDTH,
            height: VPC_HEIGHT,
          };
          const vpcId = `vpc-${containerNumber}`;

          commitGraphChange(({ nodes, edges }) => {
            const nodesById = new Map(nodes.map((node) => [node.id, node]));

            // Check if VPC is dropped inside a Region
            const parentRegion = nodes.find(
              (n) => isRegionNode(n) && isRectIntersecting(vpcRect, getNodeRect(n, nodesById)),
            );
            const parentRegionPosition = parentRegion
              ? getAbsolutePosition(parentRegion, nodesById)
              : null;

            const vpcRelativePosition = parentRegionPosition
              ? {
                  x: vpcPosition.x - parentRegionPosition.x,
                  y: vpcPosition.y - parentRegionPosition.y,
                }
              : vpcPosition;

            const allNodes = orderNodesForSubflows([
              ...nodes.map((node) => {
                // Don't absorb other containers into the new VPC on drop
                if (isNetworkContainerNode(node)) {
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
                parentId: parentRegion?.id,
                position: vpcRelativePosition,
                data: { containerType: "vpc", label: "VPC", ...pulseData },
                style: VPC_STYLE,
              },
            ]);

            if (parentRegion) {
              const { width: rw, height: rh } = getNodeSize(parentRegion);
              return { nodes: redistributeVpcNodes(parentRegion.id, rw, rh, allNodes), edges };
            }
            return { nodes: allNodes, edges };
          });
          return;
        }

        const nodeId = `${service.id}-${serviceIdRef.current++}`;
        const nodePosition = {
          x: position.x - SERVICE_DROP_OFFSET.x,
          y: position.y - SERVICE_DROP_OFFSET.y,
        };

        commitGraphChange(({ nodes, edges }) => {
          const parentedPosition = getParentedPosition(
            nodePosition,
            { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
            nodes,
          );

          const newNode: AppNode = {
            id: nodeId,
            type: AWS_SERVICE_NODE_TYPE,
            ...parentedPosition,
            data: { ...getAwsServiceNodeData(service), ...pulseData },
          };

          return { nodes: addNodeWithAzSync(newNode, nodes), edges };
        });
        return;
      }

      if (tool.type === "user") {
        const nodeId = `user-${serviceIdRef.current++}`;
        const nodePosition = {
          x: position.x - SERVICE_DROP_OFFSET.x,
          y: position.y - SERVICE_DROP_OFFSET.y,
        };
        commitGraphChange(({ nodes, edges }) => {
          const parentedPosition = getParentedPosition(
            nodePosition,
            { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
            nodes,
          );

          const newNode: AppNode = {
            id: nodeId,
            type: "user",
            ...parentedPosition,
            data: { label: t.user, fields: { label: t.user }, ...pulseData },
          };

          return { nodes: addNodeWithAzSync(newNode, nodes), edges };
        });
        return;
      }

      if (tool.type === "region") {
        const containerNumber = containerIdRef.current++;
        const regionPosition = {
          x: position.x - REGION_WIDTH / 2,
          y: position.y - REGION_HEIGHT / 2,
        };
        const regionId = `region-${containerNumber}`;

        commitGraphChange(({ nodes, edges }) => ({
          nodes: orderNodesForSubflows([
            ...nodes,
            {
              id: regionId,
              type: "networkContainer",
              position: regionPosition,
              data: {
                containerType: "region",
                label: `${t.region} us-east-1`,
                fields: { region: "us-east-1" },
                ...pulseData,
              },
              style: REGION_STYLE,
            },
          ]),
          edges,
        }));
        return;
      }

      if (tool.type === "az") {
        const containerNumber = containerIdRef.current++;
        const azPosition = {
          x: position.x - AZ_WIDTH / 2,
          y: position.y - AZ_HEIGHT / 2,
        };
        const azRect = { ...azPosition, width: AZ_WIDTH, height: AZ_HEIGHT };
        const azId = `az-${containerNumber}`;

        commitGraphChange(({ nodes, edges }) => {
          const nodesById = new Map(nodes.map((node) => [node.id, node]));
          const parentContainer = findIntersectingContainer(azRect, nodes, nodesById, {
            id: azId,
            type: "networkContainer",
            position: azPosition,
            data: { containerType: "az", label: t.availabilityZone },
          });
          const parentPosition = parentContainer
            ? getAbsolutePosition(parentContainer, nodesById)
            : null;

          return {
            nodes: orderNodesForSubflows([
              ...nodes,
              {
                id: azId,
                type: "networkContainer",
                parentId: parentContainer?.id,
                position: parentPosition
                  ? { x: azPosition.x - parentPosition.x, y: azPosition.y - parentPosition.y }
                  : azPosition,
                data: {
                  containerType: "az" as const,
                  label: t.availabilityZone,
                  ...pulseData,
                },
                style: AZ_STYLE,
              },
            ]),
            edges,
          };
        });
        return;
      }

      const containerNumber = containerIdRef.current++;
      const subnetNumber = subnetIdRef.current++;
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

      commitGraphChange(({ nodes, edges }) => {
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
              label: t.subnetLabel(t.public, subnetNumber),
              subnetType: "Public",
            },
          },
        );
        const parentVpcPosition = parentVpc
          ? getAbsolutePosition(parentVpc, nodesById)
          : null;

        const allNodes = orderNodesForSubflows([
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
              label: t.subnetLabel(t.public, subnetNumber),
              subnetType: "Public",
              ...pulseData,
            },
            style: CONTAINER_STYLE,
          },
        ]);

        if (parentVpc) {
          const { width: pw, height: ph } = getNodeSize(parentVpc);
          return { nodes: redistributeSubnetNodes(parentVpc.id, pw, ph, allNodes), edges };
        }
        return { nodes: allNodes, edges };
      });
    },
    [commitGraphChange, t],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      activeDragToolRef.current = null;
      setDropTargetNodeId(null);
      setDropPreview(null);

      const droppedTool =
        decodeDragTool(event.dataTransfer.getData(DND_MIME_TYPE)) ??
        activeDragToolRef.current;
      if (!droppedTool || !reactFlowInstance) {
        return;
      }

      addToolAtPosition(
        droppedTool,
        reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      );
    },
    [addToolAtPosition, reactFlowInstance, setDropPreview, setDropTargetNodeId],
  );

  const handleToolDragStart = useCallback((tool: DragTool) => {
    activeDragToolRef.current = tool;
  }, []);

  const handleToolDragEnd = useCallback(() => {
    activeDragToolRef.current = null;
    setDropTargetNodeId(null);
    setDropPreview(null);
  }, [setDropPreview, setDropTargetNodeId]);

  const addToolAtViewportCenter = useCallback(
    (tool: DragTool) => {
      if (!reactFlowInstance || !containerRef.current) {
        return;
      }

      const bounds = containerRef.current.getBoundingClientRect();
      addToolAtPosition(
        tool,
        reactFlowInstance.screenToFlowPosition({
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        }),
        `${CLICK_PULSE_PREFIX}-${pulseIdRef.current++}`,
      );
    },
    [addToolAtPosition, reactFlowInstance],
  );

  const syncNodeSubnet = useCallback(
    (draggedNodeIds: string[]) => {
      setNodes((nodes) => {
        const nodesById = new Map(nodes.map((node) => [node.id, node]));
        const draggedNodes = draggedNodeIds
          .map((draggedNodeId) => nodesById.get(draggedNodeId))
          .filter((node): node is AppNode => Boolean(node));

        if (!draggedNodes.length) {
          return nodes;
        }

        const containerNodes = nodes.filter(isNetworkContainerNode);
        const updates = new Map<string, AppNode>();
        const reparentedContainers = new Map<
          string,
          { oldParentId?: string; childType: ReturnType<typeof getNetworkContainerType> }
        >();

        function getUpdatedNode(node: AppNode) {
          return updates.get(node.id) ?? node;
        }

        function updateContainerForNode(
          node: AppNode,
          forcedContainer?: AppNode,
        ) {
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

        draggedNodes.forEach((draggedNode) => {
          if (isNetworkContainerNode(draggedNode)) {
            // Re-parent the dragged container to its new ancestor.
            updateContainerForNode(draggedNode);

            reparentedContainers.set(draggedNode.id, {
              oldParentId: draggedNode.parentId,
              childType: getNetworkContainerType(draggedNode),
            });

            const draggedContainerRect = getNodeRect(draggedNode, nodesById);

            nodes.forEach((node) => {
              // Skip the dragged container and other containers - only absorb service/user nodes.
              if (node.id === draggedNode.id || isNetworkContainerNode(node)) {
                return;
              }

              const currentNode = getUpdatedNode(node);
              const nodeRect = getNodeRect(currentNode, nodesById);

              if (isRectIntersecting(nodeRect, draggedContainerRect)) {
                updateContainerForNode(currentNode, draggedNode);
              }
            });
            return;
          }

          updateContainerForNode(draggedNode);
        });

        let result = orderNodesForSubflows(
          nodes.map((node) => updates.get(node.id) ?? node),
        );

        // After reparenting containers, redistribute their siblings in new and old parents.
        for (const [draggedNodeId, { oldParentId, childType }] of reparentedContainers) {
          const newParentId = updates.get(draggedNodeId)?.parentId;
          const parentsToRedistribute = new Set<string>();
          if (newParentId) parentsToRedistribute.add(newParentId);
          if (oldParentId && oldParentId !== newParentId) parentsToRedistribute.add(oldParentId);

          if (childType) {
            for (const parentId of parentsToRedistribute) {
              result = redistributeChildContainers(parentId, childType, result);
            }
          }
        }

        return draggedNodes.reduce(
          (currentNodes, draggedNode) =>
            isNetworkContainerNode(draggedNode)
              ? currentNodes
              : syncNodeGroupPosition(draggedNode.id, currentNodes),
          result,
        );
      });
    },
    [setNodes],
  );

  const onNodeDrag: OnNodeDrag<AppNode> = useCallback(
    (_event, node) => {
      if (!isNetworkContainerNode(node)) {
        if (dropTargetNodeId !== null) setDropTargetNodeId(null);
        setDropPreview(null);
        return;
      }

      const { nodes: currentNodes } = useFlowStore.getState();
      const nodesById = new Map(currentNodes.map((n) => [n.id, n]));
      const nodeRect = getNodeRect(node, nodesById);
      const containerNodes = currentNodes.filter(isNetworkContainerNode);
      const target = findIntersectingContainer(nodeRect, containerNodes, nodesById, node);
      const childType = getNetworkContainerType(node);
      const isNewParent = target && target.id !== node.parentId;

      setDropTargetNodeId(isNewParent ? target.id : null);
      setDropPreview(isNewParent && childType ? { parentId: target.id, childType } : null);
    },
    [dropTargetNodeId, setDropPreview, setDropTargetNodeId],
  );

  const onNodeDragStop: OnNodeDrag<AppNode> = useCallback(
    (_event, node, draggedNodes) => {
      setDropTargetNodeId(null);
      setDropPreview(null);
      syncNodeSubnet(
        draggedNodes.length
          ? draggedNodes.map((draggedNode) => draggedNode.id)
          : [node.id],
      );
    },
    [syncNodeSubnet, setDropPreview, setDropTargetNodeId],
  );

  return (
    <TooltipProvider delayDuration={250}>
      <DragDropSidebar
        labels={{
          dragAndDrop: t.dragAndDrop,
          dragOrClickToAdd: t.dragOrClickToAdd,
          dragSubnet: t.dragSubnet,
          dragRegion: t.dragRegion,
          dragAz: t.dragAz,
          subnet: t.subnet,
          region: t.region,
          az: t.availabilityZone,
          user: t.user,
          userDescription: t.userDescription,
          regionDescription: t.regionDescription,
          azDescription: t.azDescription,
          subnetDescription: t.subnetDescription,
          dragService: t.dragService,
          getServiceDescription: (service) =>
            getServiceDescription(service, locale),
        }}
        onToolClick={addToolAtViewportCenter}
        onToolDragStart={handleToolDragStart}
        onToolDragEnd={handleToolDragEnd}
      />
      <div ref={containerRef} style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          className="dark"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onInit={handleInit}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          fitView
          fitViewOptions={{ padding: INITIAL_FIT_VIEW_PADDING }}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <ServiceSearch />
        </ReactFlow>
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setInspectorOpen((v) => !v)}
                aria-label={inspectorOpen ? t.closeInspector : t.openInspector}
              >
                {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {inspectorOpen ? t.closeInspector : t.openInspector}
            </TooltipContent>
          </Tooltip>
          <NewToolMenu
            labels={{
              newTool: t.newTool,
              newToolTooltip: t.newToolTooltip,
              newToolConfirmTitle: t.newToolConfirmTitle,
              newToolConfirmDescription: t.newToolConfirmDescription,
              newToolConfirmAction: t.newToolConfirmAction,
              newToolConfirmCancel: t.newToolConfirmCancel,
            }}
            onReset={resetCanvas}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
