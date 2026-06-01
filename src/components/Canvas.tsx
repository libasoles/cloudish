import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  addEdge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type OnConnect,
  type NodeTypes,
  type OnNodeDrag,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import DragDropSidebar from "@/components/DragDropSidebar";
import AwsServiceNode from "@/components/AwsServiceNode";
import NetworkContainerNode from "@/components/NetworkContainerNode";
import UserNode from "@/components/UserNode";
import ServiceSearch from "@/components/ServiceSearch";
import { AWS_SERVICES } from "@/data/aws-services";
import {
  AWS_SERVICE_NODE_TYPE,
  DND_MIME_TYPE,
  decodeDragTool,
  type DragTool,
} from "@/lib/drag-tools";
import type { AppEdge, AppNode } from "@/types/flow";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import {
  isNetworkContainerNode,
  isRegionNode,
  isVpcNode,
  isAzNode,
  isSubnetNode,
  orderNodesForSubflows,
  getNodeRect,
  getNodeSize,
  getAbsolutePosition,
  isRectIntersecting,
  findIntersectingContainer,
  getParentedPosition,
  mirrorNodeToSiblingAzs,
  redistributeSubnetNodes,
  redistributeVpcNodes,
  REGION_STYLE,
  REGION_WIDTH,
  REGION_HEIGHT,
  VPC_STYLE,
  VPC_WIDTH,
  VPC_HEIGHT,
  CONTAINER_STYLE,
  CONTAINER_WIDTH,
  CONTAINER_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from "@/lib/graph-utils";
import { getAwsServiceNodeData } from "@/lib/node-utils";
import { EDGE_STYLE } from "@/lib/edge-tools";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
  networkContainer: NetworkContainerNode,
  user: UserNode,
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
    setEdges,
    inspectorOpen,
    setInspectorOpen,
    dropTargetNodeId,
    setDropTargetNodeId,
  } = useFlowStore();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    AppNode,
    AppEdge
  > | null>(null);
  const containerIdRef = useRef(1);
  const subnetIdRef = useRef(1);
  const serviceIdRef = useRef(1);
  const pulseIdRef = useRef(1);
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
    (connection) =>
      setEdges((edges) => addEdge({ ...connection, style: EDGE_STYLE }, edges)),
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

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

          setNodes((nodes) => {
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
              return redistributeVpcNodes(parentRegion.id, rw, rh, allNodes);
            }
            return allNodes;
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
            { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
            nodes,
          );

          const newNode: AppNode = {
            id: nodeId,
            type: AWS_SERVICE_NODE_TYPE,
            ...parentedPosition,
            data: { ...getAwsServiceNodeData(service), ...pulseData },
          };

          const mirrors = mirrorNodeToSiblingAzs(
            newNode,
            nodes,
            (sibAzId) => `${nodeId}-m-${sibAzId}`,
          );

          return orderNodesForSubflows([...nodes, newNode, ...mirrors]);
        });
        return;
      }

      if (tool.type === "user") {
        const nodeId = `user-${serviceIdRef.current++}`;
        const nodePosition = {
          x: position.x - SERVICE_DROP_OFFSET.x,
          y: position.y - SERVICE_DROP_OFFSET.y,
        };
        setNodes((nodes) => {
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

          const mirrors = mirrorNodeToSiblingAzs(
            newNode,
            nodes,
            (sibAzId) => `${nodeId}-m-${sibAzId}`,
          );

          return orderNodesForSubflows([...nodes, newNode, ...mirrors]);
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

        setNodes((nodes) => {
          return orderNodesForSubflows([
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
          ]);
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
              label: `${t.public} ${t.subnet} ${subnetNumber}`,
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
              label: `${t.public} ${t.subnet} ${subnetNumber}`,
              subnetType: "Public",
              ...pulseData,
            },
            style: CONTAINER_STYLE,
          },
        ]);

        if (parentVpc) {
          const { width: pw, height: ph } = getNodeSize(parentVpc);
          return redistributeSubnetNodes(parentVpc.id, pw, ph, allNodes);
        }
        return allNodes;
      });
    },
    [setNodes, t.public, t.subnet, t.user, t.region],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const droppedTool = decodeDragTool(
        event.dataTransfer.getData(DND_MIME_TYPE),
      );
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
    [addToolAtPosition, reactFlowInstance],
  );

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
          // Re-parent the dragged container to its new ancestor
          updateContainerForNode(draggedNode);

          const draggedContainerRect = getNodeRect(draggedNode, nodesById);

          nodes.forEach((node) => {
            // Skip the dragged container and other containers - only absorb service/user nodes
            if (node.id === draggedNode.id || isNetworkContainerNode(node)) {
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

        let result = orderNodesForSubflows(
          nodes.map((node) => updates.get(node.id) ?? node),
        );

        // After reparenting a container, redistribute its siblings in new and old parent
        if (isNetworkContainerNode(draggedNode)) {
          const reparentedNode = updates.get(draggedNodeId);
          const oldParentId = draggedNode.parentId;
          const newParentId = reparentedNode?.parentId;
          const resultById = new Map(result.map((n) => [n.id, n]));

          const parentsToRedistribute = new Set<string>();
          if (newParentId) parentsToRedistribute.add(newParentId);
          if (oldParentId && oldParentId !== newParentId) parentsToRedistribute.add(oldParentId);

          for (const parentId of parentsToRedistribute) {
            const parent = resultById.get(parentId);
            if (!parent) continue;
            const { width: pw, height: ph } = getNodeSize(parent);

            if (isSubnetNode(draggedNode) && (isVpcNode(parent) || isAzNode(parent))) {
              result = redistributeSubnetNodes(parentId, pw, ph, result);
            } else if (isVpcNode(draggedNode) && isRegionNode(parent)) {
              result = redistributeVpcNodes(parentId, pw, ph, result);
            }
          }
        }

        return result;
      });
    },
    [setNodes],
  );

  const onNodeDrag: OnNodeDrag<AppNode> = useCallback(
    (_event, node) => {
      if (!isNetworkContainerNode(node)) {
        if (dropTargetNodeId !== null) setDropTargetNodeId(null);
        return;
      }

      const { nodes: currentNodes } = useFlowStore.getState();
      const nodesById = new Map(currentNodes.map((n) => [n.id, n]));
      const nodeRect = getNodeRect(node, nodesById);
      const containerNodes = currentNodes.filter(isNetworkContainerNode);
      const target = findIntersectingContainer(nodeRect, containerNodes, nodesById, node);

      setDropTargetNodeId(target?.id ?? null);
    },
    [dropTargetNodeId, setDropTargetNodeId],
  );

  const onNodeDragStop: OnNodeDrag<AppNode> = useCallback(
    (_event, node) => {
      setDropTargetNodeId(null);
      syncNodeSubnet(node.id);
    },
    [syncNodeSubnet, setDropTargetNodeId],
  );

  return (
    <>
      <DragDropSidebar
        labels={{
          dragAndDrop: t.dragAndDrop,
          dragSubnet: t.dragSubnet,
          dragRegion: t.dragRegion,
          subnet: t.subnet,
          region: t.region,
          user: t.user,
          dragService: t.dragService,
        }}
        onToolClick={addToolAtViewportCenter}
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
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
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
    </>
  );
}
