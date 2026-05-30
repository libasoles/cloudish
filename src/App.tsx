import { useCallback, useState } from "react";
import {
  ReactFlow, addEdge, useNodesState, useEdgesState,
  Controls, MiniMap, Background, BackgroundVariant, type OnConnect, type Node, type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import AwsServiceNode, { type AwsServiceNodeType, type AwsServiceNodeData } from "@/components/AwsServiceNode";
import ServiceSearch from "@/components/ServiceSearch";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
};

type AppNode = Node | AwsServiceNodeType;

const initialNodes: AppNode[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "2", position: { x: 0, y: 150 }, data: { label: "Node 2" } },
  { id: "3", position: { x: 200, y: 75 }, data: { label: "Node 3" } },
];
const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
];

export default function App() {
  const [nodes, , onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
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
          onConnect={onConnect} nodeTypes={nodeTypes} fitView
        >
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
