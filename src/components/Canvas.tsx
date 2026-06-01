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
import AwsServiceNode from "@/components/AwsServiceNode";
import NetworkContainerNode from "@/components/NetworkContainerNode";
import UserNode from "@/components/UserNode";
import ServiceSearch from "@/components/ServiceSearch";
import { AWS_SERVICES } from "@/data/aws-services";
import {
  AWS_SERVICE_NODE_TYPE,
  DND_MIME_TYPE,
  decodeDragTool,
} from "@/lib/drag-tools";
import type { AppEdge, AppNode } from "@/types/flow";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import {
  isNetworkContainerNode,
  isVpcNode,
  orderNodesForSubflows,
  getNodeRect,
  getAbsolutePosition,
  isRectIntersecting,
  findIntersectingContainer,
  getParentedPosition,
  CONTAINER_STYLE,
  CONTAINER_WIDTH,
  CONTAINER_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from "@/lib/graph-utils";
import { getAwsServiceNodeData } from "@/lib/node-utils";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
  networkContainer: NetworkContainerNode,
  user: UserNode,
};

const SERVICE_DROP_OFFSET = { x: 50, y: 36 };
const INITIAL_FIT_VIEW_PADDING = 1.3;
const VPC_SERVICE_ID = "vpc";

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
  } = useFlowStore();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    AppNode,
    AppEdge
  > | null>(null);
  const containerIdRef = useRef(1);
  const serviceIdRef = useRef(1);
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
                style: CONTAINER_STYLE,
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
            { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
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

      if (droppedTool.type === "user") {
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
          return orderNodesForSubflows([
            ...nodes,
            {
              id: nodeId,
              type: "user",
              ...parentedPosition,
              data: { label: "User" },
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
            style: CONTAINER_STYLE,
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

  return (
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
  );
}
