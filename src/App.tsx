import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow, addEdge, useNodesState, useEdgesState,
  Controls, MiniMap, Background, BackgroundVariant, Panel, Position, type Edge, type OnConnect, type Node, type NodeTypes, type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container, PanelRightClose, PanelRightOpen } from "lucide-react";
import AwsServiceNode, { type AwsServiceNodeType, type AwsServiceNodeData } from "@/components/AwsServiceNode";
import ServiceSearch from "@/components/ServiceSearch";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
};

type AppNode = Node | AwsServiceNodeType;
type AppEdge = Edge;

const CONTAINER_NODE_TYPE = "container";
const CONTAINER_WIDTH = 320;
const CONTAINER_HEIGHT = 220;

const initialNodes: AppNode[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Node 1" }, targetPosition: Position.Left, sourcePosition: Position.Right },
  { id: "2", position: { x: 0, y: 150 }, data: { label: "Node 2" }, targetPosition: Position.Left, sourcePosition: Position.Right },
  { id: "3", position: { x: 200, y: 75 }, data: { label: "Node 3" }, targetPosition: Position.Left, sourcePosition: Position.Right },
];
const initialEdges: AppEdge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
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

      setNodes((nodes) => [
        ...nodes,
        {
          id: `container-${containerNumber}`,
          type: "group",
          position: {
            x: position.x - CONTAINER_WIDTH / 2,
            y: position.y - CONTAINER_HEIGHT / 2,
          },
          data: { label: `Container ${containerNumber}` },
          style: {
            width: CONTAINER_WIDTH,
            height: CONTAINER_HEIGHT,
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.35)",
            borderRadius: 8,
          },
        },
      ]);
    },
    [reactFlowInstance, setNodes],
  );

  const selectedNode = nodes.find((n) => n.selected);

  const selectedLabel =
    selectedNode?.type === 'awsService'
      ? (selectedNode.data as AwsServiceNodeData).name
      : String((selectedNode?.data as { label?: unknown })?.label ?? '');

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onDragOver={onDragOver} onDrop={onDrop}
          onInit={setReactFlowInstance} nodeTypes={nodeTypes} fitView
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
            {selectedNode ? (
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
