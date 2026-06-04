import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  type OnConnect,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type OnNodeDrag,
  type OnMoveEnd,
  type ReactFlowInstance,
  type NodeChange,
  type NodeSelectionChange,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import DragDropSidebar from "@/components/DragDropSidebar";
import NewToolMenu from "@/components/NewToolMenu";
import ExportMenu from "@/components/ExportMenu";
import SaveArchitectureButton from "@/components/SaveArchitectureButton";
import DeleteArchitectureButton from "@/components/DeleteArchitectureButton";
import { ProjectNameEditor } from "@/components/ProjectNameEditor";
const AuthDialog = lazy(() => import("@/components/AuthDialog"));
import AwsServiceNode from "@/components/AwsServiceNode";
import NetworkContainerNode from "@/components/NetworkContainerNode";
import PlainTextNode from "@/components/PlainTextNode";
import UserNode from "@/components/UserNode";
import InternetNode from "@/components/InternetNode";
import SelectionGroupNode from "@/components/SelectionGroupNode";
import EditableEdge from "@/components/EditableEdge";
import ServiceSearch from "@/components/ServiceSearch";
import { SelectionToolbar } from "@/components/SelectionToolbar";
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
  isAzNode,
  isRegionNode,
  isSubnetNode,
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
  ASG_STYLE,
  ASG_WIDTH,
  ASG_HEIGHT,
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
import type { ExportFormat } from "@/lib/export/types";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteArchitecture,
  useRenameArchitecture,
  useSaveArchitecture,
} from "@/hooks/useArchitectures";
import { useUrlProjectLoad } from "@/hooks/useUrlProjectLoad";
import {
  clearUrlArchitectureId,
  setUrlArchitectureId,
} from "@/lib/url-utils";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";

const SELECTION_GROUP_ID = "__selection-group__";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
  networkContainer: NetworkContainerNode,
  plainText: PlainTextNode,
  user: UserNode,
  internet: InternetNode,
  selectionGroup: SelectionGroupNode,
};

const edgeTypes: EdgeTypes = {
  default: EditableEdge,
};

const SERVICE_DROP_OFFSET = { x: 50, y: 36 };
const TEXT_DROP_OFFSET = { x: 8, y: 14 };
const TEXT_NODE_WIDTH = 180;
const TEXT_NODE_HEIGHT = 56;
const TEXT_NODE_STYLE = {
  width: TEXT_NODE_WIDTH,
  height: TEXT_NODE_HEIGHT,
} as const;
const TEXT_NODE_FONT_SIZE = Math.min(TEXT_NODE_WIDTH / 8, TEXT_NODE_HEIGHT * 0.46);
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
    currentArchitectureId,
    projectName,
    viewport,
    viewportRestoreKey,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setViewport,
    setCurrentArchitectureId,
    setProjectName,
    commitGraphChange,
    isDirty,
    markSaved,
    inspectorOpen,
    setInspectorOpen,
    dropTargetNodeId,
    setDropTargetNodeId,
    setDropPreview,
    setEditingEdgeId,
    selectionBoxActive,
    setSelectionBoxActive,
    resetCanvas,
  } = useFlowStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    AppNode,
    AppEdge
  > | null>(null);
  const { user } = useAuth();
  useUrlProjectLoad();
  const saveArchitectureMutation = useSaveArchitecture();
  const renameArchitectureMutation = useRenameArchitecture();
  const deleteArchitectureMutation = useDeleteArchitecture();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMounted, setAuthDialogMounted] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  const containerIdRef = useRef(1);
  const subnetIdRef = useRef(1);
  const serviceIdRef = useRef(1);
  const textIdRef = useRef(1);
  const edgeIdRef = useRef(1);
  const pulseIdRef = useRef(1);
  const activeDragToolRef = useRef<DragTool | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRestoringViewportRef = useRef(false);
  const shiftSelectionBaseRef = useRef<Set<string>>(new Set());
  // Tracks which node was Shift+clicked (null = bounding box drag or pane click).
  // Used to exclude that node from base-set re-selection so the user can deselect it.
  const shiftClickedNodeRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Fires in CAPTURE phase (before React Flow's node handlers) so we reset
  // shiftClickedNodeRef first; handleNodeMouseDown overrides it if a node was hit.
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey && e.button === 0) {
      shiftClickedNodeRef.current = null;
      shiftSelectionBaseRef.current = new Set(
        nodesRef.current.filter((n) => n.selected).map((n) => n.id),
      );
    }
  }, []);


  // When the selectionGroup node intercepts a Shift+Click (it has zIndex:1000 so React
  // Flow's hit-test always routes clicks there), we find the actual node at that position
  // and toggle its selection directly, bypassing handleNodesChange protection.
  // onNodeClick fires on the 'click' event — AFTER 'mouseup' — which lets the lazy
  // setTimeout in the mouseup fallback read the updated shiftClickedNodeRef.
  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: AppNode) => {
      if (node.id !== SELECTION_GROUP_ID || !e.shiftKey || !reactFlowInstance) return;

      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const { nodes: currentNodes } = useFlowStore.getState();
      const nodesById = new Map(currentNodes.map((n) => [n.id, n]));

      const targetNode = [...currentNodes]
        .filter((n) => n.id !== SELECTION_GROUP_ID && n.type !== "selectionGroup")
        .reverse()
        .find((n) => {
          const pos = getAbsolutePosition(n, nodesById);
          const w = n.measured?.width ?? DEFAULT_NODE_WIDTH;
          const h = n.measured?.height ?? DEFAULT_NODE_HEIGHT;
          return (
            flowPos.x >= pos.x &&
            flowPos.x <= pos.x + w &&
            flowPos.y >= pos.y &&
            flowPos.y <= pos.y + h
          );
        });

      if (!targetNode) return;

      // Update ref so the mouseup fallback (scheduled before this click event fires)
      // sees the actual clicked node and skips re-selecting it.
      shiftClickedNodeRef.current = targetNode.id;

      setNodes((current) =>
        current.map((n) =>
          n.id === targetNode.id ? { ...n, selected: !n.selected } : n,
        ),
      );
    },
    [reactFlowInstance, setNodes],
  );

  // On each pointer-move during a Shift+drag selection box, React Flow calls
  // resetSelectedElements() which deselects every node (including the "base"
  // selection we want to preserve) and then fires triggerNodeChanges → onNodesChange.
  // We intercept those deselections here and re-select every base node that was
  // spuriously cleared — EXCEPT the one the user deliberately Shift+clicked on.
  const handleNodesChange = useCallback((changes: NodeChange<AppNode>[]) => {
    // When the user clicks the group node's transparent body (not a handle),
    // React Flow fires a select:true for the group AND select:false for all other
    // selected nodes. Drop the entire batch to keep the current selection intact.
    const groupIsBeingSelected = changes.some(
      (c) => "id" in c && c.id === SELECTION_GROUP_ID && c.type === "select" && (c as NodeSelectionChange).selected,
    );
    if (groupIsBeingSelected) return;

    const realChanges = changes.filter(
      (c) => !("id" in c && c.id === SELECTION_GROUP_ID),
    );
    const base = shiftSelectionBaseRef.current;
    if (base.size > 0) {
      const clickedId = shiftClickedNodeRef.current;
      const baseDeselections = realChanges.filter(
        (c): c is NodeSelectionChange =>
          c.type === "select" &&
          !(c as NodeSelectionChange).selected &&
          base.has((c as NodeSelectionChange).id) &&
          (c as NodeSelectionChange).id !== clickedId,
      );
      if (baseDeselections.length > 0) {
        const reselections: NodeChange<AppNode>[] = baseDeselections.map((c) => ({
          type: "select" as const,
          id: c.id,
          selected: true,
        }));
        onNodesChange([...realChanges, ...reselections]);
        return;
      }
    }
    onNodesChange(realChanges);
  }, [onNodesChange]);

  useEffect(() => {
    const onMouseUp = () => {
      if (shiftSelectionBaseRef.current.size === 0) {
        shiftClickedNodeRef.current = null;
        return;
      }
      const base = new Set(shiftSelectionBaseRef.current);
      shiftSelectionBaseRef.current.clear();
      // Read shiftClickedNodeRef lazily inside setTimeout: the 'click' event (which
      // fires handleNodeClick and updates shiftClickedNodeRef) fires after 'mouseup',
      // so by the time setTimeout runs, the ref has the correct node id.
      setTimeout(() => {
        const clickedId = shiftClickedNodeRef.current;
        shiftClickedNodeRef.current = null;
        const reselect: NodeChange<AppNode>[] = nodesRef.current
          .filter((n) => base.has(n.id) && !n.selected && n.id !== clickedId)
          .map((n) => ({ type: "select" as const, id: n.id, selected: true }));
        if (reselect.length > 0) onNodesChange(reselect);
      }, 0);
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [onNodesChange]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const { exportFlow, downloadExport } = await import("@/lib/export");
      const result = exportFlow(format, nodes);
      downloadExport(result);
    },
    [nodes],
  );

  const handleSave = useCallback(async () => {
    const currentViewport = reactFlowInstance?.getViewport() ?? viewport;
    const result = await saveArchitectureMutation.mutateAsync({
      architectureId: currentArchitectureId,
      name: projectName?.trim() || t.defaultArchitectureName,
      nodes,
      edges,
      viewport: currentViewport,
    });

    setCurrentArchitectureId(result.architectureId);
    setUrlArchitectureId(result.architectureId);
    markSaved();
  }, [
    saveArchitectureMutation,
    currentArchitectureId,
    edges,
    markSaved,
    nodes,
    projectName,
    reactFlowInstance,
    setCurrentArchitectureId,
    t.defaultArchitectureName,
    viewport,
  ]);

  const handleProjectNameChange = useCallback(
    (nextName: string) => {
      setProjectName(nextName);

      if (!user || !currentArchitectureId) return;

      renameArchitectureMutation.mutate(
        {
          architectureId: currentArchitectureId,
          name: nextName,
        },
        {
          onError: (error) => {
            console.error(error);
          },
        },
      );
    },
    [
      currentArchitectureId,
      renameArchitectureMutation,
      setProjectName,
      user,
    ],
  );

  const handleReset = useCallback(() => {
    resetCanvas();
    clearUrlArchitectureId();
  }, [resetCanvas]);

  const handleDelete = useCallback(async () => {
    if (!currentArchitectureId) return;

    await deleteArchitectureMutation.mutateAsync({
      architectureId: currentArchitectureId,
    });
    resetCanvas();
    clearUrlArchitectureId();
  }, [currentArchitectureId, deleteArchitectureMutation, resetCanvas]);

  const handleAuthRequired = useCallback(() => {
    setPendingSave(true);
    setAuthDialogMounted(true);
    setAuthDialogOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    setAuthDialogOpen(false);
    if (pendingSave) {
      setPendingSave(false);
      await handleSave();
    }
  }, [pendingSave, handleSave]);

  const handleInit = useCallback(
    (instance: ReactFlowInstance<AppNode, AppEdge>) => {
      setReactFlowInstance(instance);
      if (viewport) {
        isRestoringViewportRef.current = true;
        void instance
          .setViewport(viewport, { duration: 0 })
          .finally(() => {
            isRestoringViewportRef.current = false;
          });
        return;
      }

      if (containerRef.current) {
        const { nodes: currentNodes } = useFlowStore.getState();
        if (currentNodes.length === 0) {
          // With no nodes, calling fitView() leaves fitViewQueued: true inside React Flow.
          // That queued fit fires when the first node's dimensions are measured (ResizeObserver),
          // causing an unwanted auto-zoom on the first drop. Skip fitView entirely.
          return;
        }

        isRestoringViewportRef.current = true;
        void instance
          .fitView({ padding: INITIAL_FIT_VIEW_PADDING })
          .then(() => {
            if (!containerRef.current) return false;
            const canvasWidth = containerRef.current.clientWidth;
            const vp = instance.getViewport();
            return instance.setViewport(
              { ...vp, x: vp.x - canvasWidth / 6 },
              { duration: 0 },
            );
          })
          .finally(() => {
            isRestoringViewportRef.current = false;
          });
      }
    },
    [setReactFlowInstance, viewport],
  );

  const applyFallbackViewport = useCallback(async () => {
    if (!reactFlowInstance || !containerRef.current) {
      return;
    }

    const { nodes: currentNodes } = useFlowStore.getState();
    if (currentNodes.length === 0) return;

    isRestoringViewportRef.current = true;
    try {
      await reactFlowInstance.fitView({ padding: INITIAL_FIT_VIEW_PADDING });
      const canvasWidth = containerRef.current.clientWidth;
      const vp = reactFlowInstance.getViewport();
      await reactFlowInstance.setViewport(
        { ...vp, x: vp.x - canvasWidth / 6 },
        { duration: 0 },
      );
    } finally {
      isRestoringViewportRef.current = false;
    }
  }, [reactFlowInstance]);

  useEffect(() => {
    if (!reactFlowInstance || viewportRestoreKey === 0) {
      return;
    }

    if (viewport) {
      isRestoringViewportRef.current = true;
      void reactFlowInstance
        .setViewport(viewport, { duration: 0 })
        .finally(() => {
          isRestoringViewportRef.current = false;
        });
      return;
    }

    void applyFallbackViewport();
  }, [applyFallbackViewport, reactFlowInstance, viewport, viewportRestoreKey]);

  const handleMoveEnd: OnMoveEnd = useCallback(
    (_event, nextViewport) => {
      if (isRestoringViewportRef.current) {
        return;
      }

      setViewport(nextViewport);
    },
    [setViewport],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const isGroupSource = connection.source === SELECTION_GROUP_ID;
      const isGroupTarget = connection.target === SELECTION_GROUP_ID;

      if (isGroupSource || isGroupTarget) {
        commitGraphChange(({ nodes: n, edges }) => {
          const selectedIds = n
            .filter((node) => node.selected && node.type !== "selectionGroup")
            .map((node) => node.id);
          let result = edges;
          for (const memberId of selectedIds) {
            const edge: AppEdge = {
              ...connection,
              id: `edge-${edgeIdRef.current++}`,
              source: isGroupSource ? memberId : connection.source!,
              target: isGroupTarget ? memberId : connection.target!,
              style: EDGE_STYLE,
            };
            result = addEdgeWithAzSync(edge, n, result);
          }
          return { nodes: n, edges: result };
        });
        return;
      }

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

      if (droppedTool.type === "asg") {
        setDropTargetNodeId(null);
        setDropPreview(null);
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
      setInspectorOpen(true);

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
                  return { ...node, selected: false };
                }

                const nodeRect = getNodeRect(node, nodesById);

                if (!isRectIntersecting(nodeRect, vpcRect)) {
                  return { ...node, selected: false };
                }

                return {
                  ...node,
                  selected: false,
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
                selected: true,
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
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: { ...getAwsServiceNodeData(service), ...pulseData },
          };

          return { nodes: addNodeWithAzSync(newNode, nodes.map((n) => ({ ...n, selected: false }))), edges };
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
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: { label: t.user, fields: { label: t.user }, ...pulseData },
          };

          return { nodes: addNodeWithAzSync(newNode, nodes.map((n) => ({ ...n, selected: false }))), edges };
        });
        return;
      }

      if (tool.type === "internet") {
        const nodeId = `internet-${serviceIdRef.current++}`;
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
            type: "internet",
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: { label: t.internet, fields: { label: t.internet }, ...pulseData },
          };

          return { nodes: addNodeWithAzSync(newNode, nodes.map((n) => ({ ...n, selected: false }))), edges };
        });
        return;
      }

      if (tool.type === "text") {
        const nodePosition = {
          x: position.x - TEXT_DROP_OFFSET.x,
          y: position.y - TEXT_DROP_OFFSET.y,
        };

        commitGraphChange(({ nodes, edges }) => {
          const existingIds = new Set(nodes.map((n) => n.id));
          let nodeId = `text-${textIdRef.current++}`;
          while (existingIds.has(nodeId)) {
            nodeId = `text-${textIdRef.current++}`;
          }

          const parentedPosition = getParentedPosition(
            nodePosition,
            { width: TEXT_NODE_WIDTH, height: TEXT_NODE_HEIGHT },
            nodes,
          );

          const newNode: AppNode = {
            id: nodeId,
            type: "plainText",
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: {
              text: "",
              fontSize: TEXT_NODE_FONT_SIZE,
              isEditing: true,
              ...pulseData,
            },
            style: TEXT_NODE_STYLE,
          };

          return { nodes: addNodeWithAzSync(newNode, nodes.map((n) => ({ ...n, selected: false }))), edges };
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
            ...nodes.map((n) => ({ ...n, selected: false })),
            {
              id: regionId,
              type: "networkContainer",
              selected: true,
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
              ...nodes.map((n) => ({ ...n, selected: false })),
              {
                id: azId,
                type: "networkContainer",
                selected: true,
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

      if (tool.type === "asg") {
        const containerNumber = containerIdRef.current++;
        const asgPosition = {
          x: position.x - ASG_WIDTH / 2,
          y: position.y - ASG_HEIGHT / 2,
        };
        const asgId = `asg-${containerNumber}`;

        commitGraphChange(({ nodes, edges }) => ({
          nodes: orderNodesForSubflows([
            ...nodes.map((n) => ({ ...n, selected: false })),
            {
              id: asgId,
              type: "networkContainer",
              selected: true,
              position: asgPosition,
              data: {
                containerType: "asg" as const,
                label: "Auto Scaling Group",
                fields: { minCapacity: 1, desiredCapacity: 2, maxCapacity: 4 },
                ...pulseData,
              },
              style: ASG_STYLE,
            },
          ]),
          edges,
        }));
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

        const nodesBeforeNewSubnet = nodes.map((node) => {
          if (isNetworkContainerNode(node)) {
            return { ...node, selected: false };
          }

          const nodeRect = getNodeRect(node, nodesById);

          if (!isRectIntersecting(nodeRect, subnetRect)) {
            return { ...node, selected: false };
          }

          return {
            ...node,
            selected: false,
            parentId: subnetId,
            position: {
              x: nodeRect.x - subnetPosition.x,
              y: nodeRect.y - subnetPosition.y,
            },
          };
        });

        const newSubnet: AppNode = {
          id: subnetId,
          type: "networkContainer",
          selected: true,
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
        };

        const absorbedNodeIds = nodesBeforeNewSubnet
          .filter(
            (node) =>
              node.parentId === subnetId && !isNetworkContainerNode(node),
          )
          .map((node) => node.id);

        let allNodes = addNodeWithAzSync(newSubnet, nodesBeforeNewSubnet);

        if (parentVpc) {
          const { width: pw, height: ph } = getNodeSize(parentVpc);
          allNodes = redistributeSubnetNodes(parentVpc.id, pw, ph, allNodes);

          if (
            isAzNode(parentVpc) &&
            (parentVpc.data as { synced?: boolean }).synced
          ) {
            const sourceSubnetIds = allNodes
              .filter((node) => node.parentId === parentVpc.id && isSubnetNode(node))
              .map((node) => node.id);

            for (const nodeId of [...sourceSubnetIds, ...absorbedNodeIds]) {
              allNodes = syncNodeGroupPosition(nodeId, allNodes);
            }
          }

          return { nodes: allNodes, edges };
        }
        return { nodes: orderNodesForSubflows(allNodes), edges };
      });
    },
    [commitGraphChange, setInspectorOpen, t],
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

  const handlePaneDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!reactFlowInstance) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (
        target.closest(
          ".react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__minimap, .react-flow__panel, button, input, textarea, select",
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      addToolAtPosition(
        { type: "text" },
        reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      );
    },
    [addToolAtPosition, reactFlowInstance],
  );

  const displayNodes = useMemo(() => {
    if (!selectionBoxActive) return nodes;
    const eligible = nodes.filter(
      (n) => n.selected && n.type !== "selectionGroup",
    );
    if (eligible.length < 2) return nodes;
    const nodesById = new Map(nodes.map((n) => [n.id, n]));
    const rects = eligible.map((n) => getNodeRect(n, nodesById));
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.width));
    const maxY = Math.max(...rects.map((r) => r.y + r.height));
    const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    const PADDING = 14;
    const w = bounds.width + PADDING * 2;
    const h = bounds.height + PADDING * 2;
    const groupNode = {
      id: SELECTION_GROUP_ID,
      type: "selectionGroup" as const,
      position: { x: bounds.x - PADDING, y: bounds.y - PADDING },
      data: {} as Record<string, never>,
      style: { width: w, height: h },
      // Pre-supply measured dimensions so React Flow doesn't set visibility:hidden
      // while waiting for ResizeObserver to report the node's size.
      measured: { width: w, height: h },
      draggable: false,
      zIndex: 1000,
    };
    return [...nodes, groupNode];
  }, [nodes, selectionBoxActive]);

  return (
    <>
      <DragDropSidebar
        labels={{
          dragAndDrop: t.dragAndDrop,
          dragOrClickToAdd: t.dragOrClickToAdd,
          dragSubnet: t.dragSubnet,
          dragText: t.dragText,
          dragRegion: t.dragRegion,
          dragAz: t.dragAz,
          subnet: t.subnet,
          text: t.text,
          region: t.region,
          az: t.availabilityZone,
          user: t.user,
          userDescription: t.userDescription,
          internet: t.internet,
          internetDescription: t.internetDescription,
          regionDescription: t.regionDescription,
          azDescription: t.azDescription,
          asg: t.asg,
          dragAsg: t.dragAsg,
          asgDescription: t.asgDescription,
          subnetDescription: t.subnetDescription,
          textDescription: t.textDescription,
          dragService: t.dragService,
          getServiceDescription: (service) =>
            getServiceDescription(service, locale),
        }}
        onToolClick={addToolAtViewportCenter}
        onToolDragStart={handleToolDragStart}
        onToolDragEnd={handleToolDragEnd}
      />
      <div
        ref={containerRef}
        style={{ flex: 1, position: "relative" }}
        onMouseDownCapture={handleContainerMouseDown}
        onDoubleClickCapture={handlePaneDoubleClick}
      >
        <ReactFlow
          className="dark"
          nodes={displayNodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onInit={handleInit}
          onMoveEnd={handleMoveEnd}
          onNodeClick={handleNodeClick}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onEdgeDoubleClick={(event, edge) => {
            event.stopPropagation();
            setEditingEdgeId(edge.id);
          }}
          onNodeDoubleClick={(_event, node) => {
            if (node.type === "plainText") return;
            if (!inspectorOpen) setInspectorOpen(true);
          }}
          onSelectionStart={() => setSelectionBoxActive(false)}
          onSelectionEnd={() => setSelectionBoxActive(true)}
          onPaneClick={() => setSelectionBoxActive(false)}
          zoomOnDoubleClick={false}
          multiSelectionKeyCode="Shift"
          selectionMode={SelectionMode.Partial}
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        >
          <Controls className="max-md:!hidden" />
          <MiniMap className="max-md:!hidden" />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <ServiceSearch />
          <SelectionToolbar />
        </ReactFlow>
        <ProjectNameEditor
          value={projectName}
          onChange={handleProjectNameChange}
        />
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
          <div className="hidden md:block">
            <HoverOnlyTooltip
              content={inspectorOpen ? t.closeInspector : t.openInspector}
              side="left"
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => setInspectorOpen((v) => !v)}
                aria-label={inspectorOpen ? t.closeInspector : t.openInspector}
              >
                {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
              </Button>
            </HoverOnlyTooltip>
          </div>
          <NewToolMenu
            labels={{
              newTool: t.newTool,
              newToolTooltip: t.newToolTooltip,
              newToolConfirmTitle: t.newToolConfirmTitle,
              newToolConfirmDescription: t.newToolConfirmDescription,
              newToolConfirmAction: t.newToolConfirmAction,
              newToolConfirmCancel: t.newToolConfirmCancel,
            }}
            onReset={handleReset}
          />
          <SaveArchitectureButton
            disabled={nodes.length === 0 || !isDirty}
            isAuthenticated={!!user}
            labels={{
              saveArchitecture: t.saveArchitecture,
              saveArchitectureTooltip: t.saveArchitectureTooltip,
              saveArchitectureSaving: t.saveArchitectureSaving,
              saveArchitectureSaved: t.saveArchitectureSaved,
              saveArchitectureSavedDescription:
                t.saveArchitectureSavedDescription,
              saveArchitectureFailed: t.saveArchitectureFailed,
              saveArchitectureFailedDescription:
                t.saveArchitectureFailedDescription,
            }}
            onSave={handleSave}
            onAuthRequired={handleAuthRequired}
          />
          {authDialogMounted && (
            <Suspense fallback={null}>
              <AuthDialog
                open={authDialogOpen}
                onOpenChange={setAuthDialogOpen}
                onSuccess={handleAuthSuccess}
              />
            </Suspense>
          )}
          <ExportMenu
            disabled={nodes.length === 0}
            labels={{
              exportTooltip: t.exportTooltip,
              exportTerraform: t.exportTerraform,
              exportCloudFormation: t.exportCloudFormation,
              exportDisclaimerTitle: t.exportDisclaimerTitle,
              exportDisclaimerDescription: t.exportDisclaimerDescription,
              exportDisclaimerAction: t.exportDisclaimerAction,
              exportDisclaimerCancel: t.exportDisclaimerCancel,
            }}
            onExport={handleExport}
          />
          {user && currentArchitectureId && (
            <DeleteArchitectureButton
              labels={{
                deleteArchitecture: t.deleteArchitecture,
                deleteArchitectureTooltip: t.deleteArchitectureTooltip,
                deleteArchitectureDeleting: t.deleteArchitectureDeleting,
                deleteArchitectureConfirmTitle:
                  t.deleteArchitectureConfirmTitle,
                deleteArchitectureConfirmDescription:
                  t.deleteArchitectureConfirmDescription,
                deleteArchitectureConfirmAction:
                  t.deleteArchitectureConfirmAction,
                deleteArchitectureConfirmCancel:
                  t.deleteArchitectureConfirmCancel,
                deleteArchitectureDeleted: t.deleteArchitectureDeleted,
                deleteArchitectureDeletedDescription:
                  t.deleteArchitectureDeletedDescription,
                deleteArchitectureFailed: t.deleteArchitectureFailed,
                deleteArchitectureFailedDescription:
                  t.deleteArchitectureFailedDescription,
              }}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </>
  );
}
