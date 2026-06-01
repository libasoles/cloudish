import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow, addEdge, useNodesState, useEdgesState,
  Controls, MiniMap, Background, BackgroundVariant, Panel, type Edge, type OnConnect, type Node, type NodeTypes, type OnNodeDrag, type ReactFlowInstance, type Rect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Container, PanelRightClose, PanelRightOpen } from "lucide-react";
import AwsServiceNode, { type AwsServiceNodeType, type AwsServiceNodeData } from "@/components/AwsServiceNode";
import ServiceSearch from "@/components/ServiceSearch";
import { AWS_CATEGORIES } from "@/data/aws-services";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
};

type AppNode = Node | AwsServiceNodeType;
type AppEdge = Edge;
type SubnetType = "Public" | "Private";
type SubnetNodeData = {
  label: string;
  subnetType: SubnetType;
};
type FlowPosition = {
  x: number;
  y: number;
};

const CONTAINER_NODE_TYPE = "container";
const CONTAINER_WIDTH = 320;
const CONTAINER_HEIGHT = 220;
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 40;

function getSubnetStyle(subnetType: SubnetType) {
  const color =
    subnetType === "Public"
      ? {
          backgroundColor: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(22, 163, 74, 0.35)",
        }
      : {
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          border: "1px solid rgba(37, 99, 235, 0.35)",
        };

  return {
    width: CONTAINER_WIDTH,
    height: CONTAINER_HEIGHT,
    borderRadius: 8,
    ...color,
  };
}

function isSubnetNode(node: AppNode) {
  return node.type === "group";
}

function orderNodesForSubflows(nodes: AppNode[]) {
  return [...nodes].sort((a, b) => {
    if (isSubnetNode(a) === isSubnetNode(b)) {
      return 0;
    }

    return isSubnetNode(a) ? -1 : 1;
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

const initialNodes: AppNode[] = [
  {
    id: "route53",
    type: "awsService",
    position: { x: 0, y: 100 },
    data: {
      name: "Route 53",
      slug: "aws-amazon-route-53",
      category: AWS_CATEGORIES.NETWORKING,
    },
  },
  {
    id: "waf",
    type: "awsService",
    position: { x: 120, y: -80 },
    data: {
      name: "WAF",
      slug: "aws-aws-waf",
      category: AWS_CATEGORIES.SECURITY,
    },
  },
  {
    id: "cloudfront",
    type: "awsService",
    position: { x: 210, y: 100 },
    data: {
      name: "CloudFront",
      slug: "aws-amazon-cloudfront",
      category: AWS_CATEGORIES.NETWORKING,
    },
  },
  {
    id: "acm",
    type: "awsService",
    position: { x: 120, y: 280 },
    data: {
      name: "ACM",
      slug: "aws-aws-certificate-manager",
      category: AWS_CATEGORIES.SECURITY,
    },
  },
  {
    id: "s3",
    type: "awsService",
    position: { x: 440, y: 100 },
    data: {
      name: "S3",
      slug: "aws-amazon-simple-storage-service",
      category: AWS_CATEGORIES.STORAGE,
    },
  },
];
const initialEdges: AppEdge[] = [
  { id: "route53-cloudfront", source: "route53", target: "cloudfront", label: "DNS" },
  { id: "waf-cloudfront", source: "waf", target: "cloudfront", label: "protects" },
  { id: "acm-cloudfront", source: "acm", target: "cloudfront", label: "TLS cert" },
  { id: "cloudfront-s3", source: "cloudfront", target: "s3", label: "origin" },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initialEdges);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<AppNode, AppEdge> | null>(null);
  const containerIdRef = useRef(1);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
  );

  const onContainerDragStart = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("application/reactflow", CONTAINER_NODE_TYPE);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const droppedType = event.dataTransfer.getData("application/reactflow");
      if (droppedType !== CONTAINER_NODE_TYPE || !reactFlowInstance) {
        return;
      }

      const containerNumber = containerIdRef.current++;
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
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

        return orderNodesForSubflows([
          ...nodes.map((node) => {
            if (isSubnetNode(node)) {
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
            type: "group",
            position: subnetPosition,
            data: { label: "Subnet", subnetType: "Public" },
            style: getSubnetStyle("Public"),
          },
        ]);
      });
    },
    [reactFlowInstance, setNodes],
  );

  const syncNodeSubnet = useCallback(
    (draggedNodeId: string) => {
      setNodes((nodes) => {
        const nodesById = new Map(nodes.map((node) => [node.id, node]));
        const draggedNode = nodesById.get(draggedNodeId);

        if (!draggedNode) {
          return nodes;
        }

        const subnetNodes = nodes.filter(isSubnetNode);
        const updates = new Map<string, AppNode>();

        function getUpdatedNode(node: AppNode) {
          return updates.get(node.id) ?? node;
        }

        function updateSubnetForNode(node: AppNode, forcedSubnet?: AppNode) {
          if (isSubnetNode(node)) {
            return;
          }

          const nodeRect = getNodeRect(node, nodesById);
          const subnetNode =
            forcedSubnet ??
            subnetNodes.find((subnet) =>
              isRectIntersecting(nodeRect, getNodeRect(subnet, nodesById)),
            );

          if (!subnetNode) {
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

          if (node.parentId === subnetNode.id) {
            return;
          }

          const subnetPosition = getAbsolutePosition(subnetNode, nodesById);

          updates.set(node.id, {
            ...node,
            parentId: subnetNode.id,
            position: {
              x: nodeRect.x - subnetPosition.x,
              y: nodeRect.y - subnetPosition.y,
            },
          });
        }

        if (isSubnetNode(draggedNode)) {
          const draggedSubnetRect = getNodeRect(draggedNode, nodesById);

          nodes.forEach((node) => {
            if (node.id === draggedNode.id || isSubnetNode(node)) {
              return;
            }

            const currentNode = getUpdatedNode(node);
            const nodeRect = getNodeRect(currentNode, nodesById);

            if (isRectIntersecting(nodeRect, draggedSubnetRect)) {
              updateSubnetForNode(currentNode, draggedNode);
            }
          });
        } else {
          updateSubnetForNode(draggedNode);
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
                data: { ...node.data, subnetType },
                style: getSubnetStyle(subnetType),
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const selectedNode = nodes.find((n) => n.selected);
  const selectedIsSubnet = selectedNode?.type === "group";

  const selectedLabel =
    selectedNode?.type === 'awsService'
      ? (selectedNode.data as AwsServiceNodeData).name
      : selectedIsSubnet
        ? "Subnet"
      : String((selectedNode?.data as { label?: unknown })?.label ?? '');

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onDragOver={onDragOver} onDrop={onDrop}
          onInit={setReactFlowInstance} onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes} fitView
        >
          <Panel position="top-left">
            <div className="mt-2 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
              <Button
                variant="ghost"
                size="icon"
                draggable
                onDragStart={onContainerDragStart}
                aria-label="Add container"
                title="Add container"
              >
                <Container className="h-4 w-4" />
              </Button>
            </div>
          </Panel>
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <ServiceSearch />
        </ReactFlow>
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline" size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
      </div>

      {sidebarOpen && (
        <Card className="w-72 rounded-none border-y-0 border-r-0 flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {selectedNode ? selectedLabel : "No node selected"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode && selectedIsSubnet ? (
              <div className="space-y-4 text-sm">
                <div className="text-muted-foreground">
                  <p>ID: {selectedNode.id}</p>
                  <p>
                    Position: ({Math.round(selectedNode.position.x)},{" "}
                    {Math.round(selectedNode.position.y)})
                  </p>
                </div>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Type
                  <Select
                    value={
                      ((selectedNode.data as Partial<SubnetNodeData>).subnetType ??
                        "Public") as SubnetType
                    }
                    onValueChange={(value) =>
                      onSubnetTypeChange(selectedNode.id, value as SubnetType)
                    }
                  >
                    <SelectTrigger className="font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
            ) : selectedNode ? (
              <div className="text-sm text-muted-foreground">
                <p>ID: {selectedNode.id}</p>
                <p>
                  Position: ({Math.round(selectedNode.position.x)},{" "}
                  {Math.round(selectedNode.position.y)})
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click a node to see its details.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
