import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  type SetStateAction,
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
  useStore,
  useStoreApi,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import DragDropSidebar from "@/components/drag-drop-sidebar/DragDropSidebar";
import { INFRASTRUCTURE_ITEMS } from "@/data/infrastructure-items";
import NewToolMenu from "@/components/NewToolMenu";
import ExportMenu from "@/components/ExportMenu";
import SaveArchitectureButton from "@/components/SaveArchitectureButton";
import DeleteArchitectureButton from "@/components/DeleteArchitectureButton";
import { ProjectNameEditor } from "@/components/ProjectNameEditor";
const AuthDialog = lazy(() => import("@/components/AuthDialog"));
import AwsServiceNode from "@/components/nodes/AwsServiceNode";
import GatewayServiceNode from "@/components/nodes/GatewayServiceNode";
import NetworkContainerNode from "@/components/nodes/network-containers/NetworkContainerNode";
import PlainTextNode from "@/components/nodes/PlainTextNode";
import MiscellaneousNode from "@/components/nodes/MiscellaneousNode";
import ImageNode from "@/components/nodes/ImageNode";
import SelectionGroupNode from "@/components/nodes/SelectionGroupNode";
import EditableEdge from "@/components/EditableEdge";
import ServiceSearch from "@/components/service-search/ServiceSearch";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { AWS_SERVICES, type PlacementScope } from "@/data/aws-services";
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
  redistributeGatewayAffectedVpcLayouts,
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
import { getAwsServiceNodeData, getServiceNodeType, getNodePlacementScope } from "@/lib/node-utils";
import {
  findAllowedAncestorForScope,
  computeBandPlacement,
  resolveBandSide,
  redistributeScopeAffectedLayouts,
  expelGlobalNodePosition,
} from "@/lib/placement";
import { EDGE_STYLE } from "@/lib/edge-tools";
import { resolveVpnGatewayEdgeLabel } from "@/lib/vpn-gateway-edges";
import type { ExportFormat } from "@/lib/export/types";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteArchitecture,
  useRenameArchitecture,
  useSaveArchitecture,
} from "@/hooks/useArchitectures";
import { useUrlProjectLoad } from "@/hooks/useUrlProjectLoad";
import { clearUrlArchitectureId, setUrlArchitectureId } from "@/lib/url-utils";
import { SELECTION_BOX_PADDING } from "@/lib/selection-constants";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/firebase-auth";
import {
  createLocalPastedImage,
  persistLocalImageNodes,
  type LocalImageAsset,
} from "@/lib/pasted-images";

const SELECTION_GROUP_ID = "__selection-group__";

const nodeTypes: NodeTypes = {
  awsService: AwsServiceNode,
  gatewayService: GatewayServiceNode,
  networkContainer: NetworkContainerNode,
  plainText: PlainTextNode,
  user: MiscellaneousNode,
  internet: MiscellaneousNode,
  web: MiscellaneousNode,
  mobile: MiscellaneousNode,
  database: MiscellaneousNode,
  image: ImageNode,
  selectionGroup: SelectionGroupNode,
};

const edgeTypes: EdgeTypes = {
  default: EditableEdge,
};

const SERVICE_DROP_OFFSET = { x: 50, y: 36 };
const TEXT_DROP_OFFSET = { x: 8, y: 14 };
const IMAGE_PASTE_OFFSET = { x: 28, y: 28 };
const TEXT_NODE_WIDTH = 180;
const TEXT_NODE_HEIGHT = 56;
const TEXT_NODE_STYLE = {
  width: TEXT_NODE_WIDTH,
  height: TEXT_NODE_HEIGHT,
} as const;
const TEXT_NODE_FONT_SIZE = Math.min(
  TEXT_NODE_WIDTH / 8,
  TEXT_NODE_HEIGHT * 0.46,
);
const INITIAL_FIT_VIEW_PADDING = 1.3;
const VPC_SERVICE_ID = "vpc";
const CLICK_PULSE_PREFIX = "sidebar-click";
const DEFAULT_EDGE_OPTIONS = {
  style: EDGE_STYLE,
};
const ID_SUFFIX_PATTERN = /-(\d+)(?:$|__)/;

function getNextNumericIdSuffix(ids: string[]) {
  const maxId = ids.reduce((max, id) => {
    const match = id.match(ID_SUFFIX_PATTERN);
    if (!match) return max;

    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return maxId + 1;
}

function getAppNodeIdFromElement(element: Element | null) {
  const nodeEl = element?.closest<HTMLElement>(".react-flow__node[data-id]");
  const nodeId = nodeEl?.dataset.id;

  if (!nodeId || nodeId === SELECTION_GROUP_ID) {
    return null;
  }

  return nodeId;
}

function getClickedAppNodeId(
  event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>,
) {
  const path = event.nativeEvent.composedPath();

  for (const item of path) {
    if (!(item instanceof Element)) {
      continue;
    }

    const nodeId = getAppNodeIdFromElement(item);
    if (nodeId) {
      return nodeId;
    }
  }

  const elementsAtPoint = event.currentTarget.ownerDocument.elementsFromPoint(
    event.clientX,
    event.clientY,
  );

  for (const element of elementsAtPoint) {
    const nodeId = getAppNodeIdFromElement(element);
    if (nodeId) {
      return nodeId;
    }
  }

  return null;
}

function areSetsEqual<T>(a: Set<T>, b: Set<T>) {
  if (a.size !== b.size) return false;

  for (const value of a) {
    if (!b.has(value)) return false;
  }

  return true;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.matches("input, textarea, select") ||
    target.closest("[contenteditable='true'], [contenteditable='']") !== null ||
    target.isContentEditable
  );
}

function getClipboardImageFiles(event: ClipboardEvent) {
  const items = Array.from(event.clipboardData?.items ?? []);

  return items
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

// Rendered inside <ReactFlow> so it can access the internal store.
// Deselects networkContainer nodes that were only *partially* inside the
// bounding-box selection — they require full enclosure to be selected.
function ContainerSelectionGuard({
  preDragContainersRef,
  setSuppressedContainerSelectionIds,
}: {
  preDragContainersRef: React.RefObject<Set<string>>;
  setSuppressedContainerSelectionIds: Dispatch<SetStateAction<Set<string>>>;
}) {
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const guardNodes = useFlowStore((state) => state.nodes);
  const storeApi = useStoreApi();
  const userSelectionRect = useStore((s) => s.userSelectionRect);
  const lastRectRef = useRef<typeof userSelectionRect>(null);
  const guardNodesRef = useRef(guardNodes);
  useLayoutEffect(() => {
    guardNodesRef.current = guardNodes;
  });

  useEffect(() => {
    const getPartiallySelectedContainerIds = (
      rect: NonNullable<typeof userSelectionRect>,
    ) => {
      const { transform, nodeLookup } = storeApi.getState();
      const [tx, ty, tZoom] = transform;

      return guardNodesRef.current
        .filter(
          (node) =>
            node.type === "networkContainer" &&
            node.selected &&
            !preDragContainersRef.current?.has(node.id),
        )
        .filter((node) => {
          const internal = nodeLookup.get(node.id);
          const posAbs = internal?.internals?.positionAbsolute;
          if (!posAbs) return false;

          const { width: w, height: h } = getNodeSize(node);
          const sx = posAbs.x * tZoom + tx;
          const sy = posAbs.y * tZoom + ty;

          return !(
            sx >= rect.x &&
            sy >= rect.y &&
            sx + w * tZoom <= rect.x + rect.width &&
            sy + h * tZoom <= rect.y + rect.height
          );
        })
        .map((node) => node.id);
    };

    if (userSelectionRect) {
      lastRectRef.current = { ...userSelectionRect };
      const ids = new Set(getPartiallySelectedContainerIds(userSelectionRect));
      setSuppressedContainerSelectionIds((current) =>
        areSetsEqual(current, ids) ? current : ids,
      );
    } else if (lastRectRef.current) {
      const rect = lastRectRef.current;
      const changes: NodeSelectionChange[] = getPartiallySelectedContainerIds(
        rect,
      ).map((id) => ({ type: "select" as const, id, selected: false }));

      if (changes.length > 0) onNodesChange(changes);
      lastRectRef.current = null;
      setSuppressedContainerSelectionIds((current) =>
        current.size === 0 ? current : new Set(),
      );
    }
  }, [
    userSelectionRect,
    storeApi,
    onNodesChange,
    preDragContainersRef,
    setSuppressedContainerSelectionIds,
  ]);

  return null;
}

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
    setDropBandSide,
    setEditingEdgeId,
    setSelectionBoxActive,
    resetCanvas,
  } = useFlowStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    AppNode,
    AppEdge
  > | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  useUrlProjectLoad();
  const saveArchitectureMutation = useSaveArchitecture();
  const renameArchitectureMutation = useRenameArchitecture();
  const deleteArchitectureMutation = useDeleteArchitecture();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMounted, setAuthDialogMounted] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [suppressedContainerSelectionIds, setSuppressedContainerSelectionIds] =
    useState<Set<string>>(new Set());

  const containerIdRef = useRef(1);
  const subnetIdRef = useRef(1);
  const serviceIdRef = useRef(1);
  const lastCreatedIdRef = useRef<string | null>(null);
  const textIdRef = useRef(1);
  const imageIdRef = useRef(1);
  const edgeIdRef = useRef(1);
  const pulseIdRef = useRef(1);
  const idScanRef = useRef({ nodes: -1, edges: -1, restore: -1 });
  const activeDragToolRef = useRef<DragTool | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRestoringViewportRef = useRef(false);
  // Set of node IDs that were selected when the user started a Shift interaction.
  // During a bounding-box drag, React Flow calls resetSelectedElements() which would
  // clear this selection; we intercept and re-select any base node except the one the
  // user intentionally Shift-clicked on.
  const shiftSelectionBaseRef = useRef<Set<string>>(new Set());
  // networkContainer IDs that were selected when the current bounding-box drag started.
  // ContainerSelectionGuard uses this to preserve containers already in the selection
  // when the user does a Shift+drag (additive selection).
  const preDragContainersRef = useRef<Set<string>>(new Set());
  // ID of the node the user Shift-clicked (detected in capture phase via DOM, before
  // React Flow fires its own selection changes). null means the click was on empty pane.
  const shiftClickedNodeRef = useRef<string | null>(null);
  const [selectionDragActive, setSelectionDragActive] = useState(false);
  // Set to true by onPaneClick — which fires BEFORE resetSelectedElements() in React
  // Flow's onClick handler — so handleNodesChange can pass through the deselections
  // instead of re-selecting the base nodes.
  const paneClickedRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const nodesRef = useRef(nodes);
  const dragOverRafRef = useRef<number | null>(null);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    if (
      idScanRef.current.nodes === nodes.length &&
      idScanRef.current.edges === edges.length &&
      idScanRef.current.restore === viewportRestoreKey
    ) {
      return;
    }
    idScanRef.current = {
      nodes: nodes.length,
      edges: edges.length,
      restore: viewportRestoreKey,
    };

    const containerIds = nodes
      .filter((node) => node.type === "networkContainer")
      .map((node) => node.id);
    const serviceIds = nodes
      .filter(
        (node) =>
          node.type === AWS_SERVICE_NODE_TYPE ||
          node.type === "user" ||
          node.type === "internet",
      )
      .map((node) => node.id);
    const textIds = nodes
      .filter((node) => node.type === "plainText")
      .map((node) => node.id);
    const imageIds = nodes
      .filter((node) => node.type === "image")
      .map((node) => node.id);

    containerIdRef.current = Math.max(
      containerIdRef.current,
      getNextNumericIdSuffix(containerIds),
    );
    subnetIdRef.current = Math.max(
      subnetIdRef.current,
      getNextNumericIdSuffix(containerIds),
    );
    serviceIdRef.current = Math.max(
      serviceIdRef.current,
      getNextNumericIdSuffix(serviceIds),
    );
    textIdRef.current = Math.max(
      textIdRef.current,
      getNextNumericIdSuffix(textIds),
    );
    imageIdRef.current = Math.max(
      imageIdRef.current,
      getNextNumericIdSuffix(imageIds),
    );
    edgeIdRef.current = Math.max(
      edgeIdRef.current,
      getNextNumericIdSuffix(edges.map((edge) => edge.id)),
    );
  }, [edges, nodes, viewportRestoreKey]);

  // Fires in CAPTURE phase — before React Flow's own handlers — so we can snapshot
  // the current selection as the "base" and identify the clicked node via DOM.
  const handleContainerPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.shiftKey && e.button === 0) {
        paneClickedRef.current = false;
        // Identify the clicked node from the DOM now, before React Flow
        // fires onNodesChange. Using capture-phase timing guarantees we set this before
        // handleNodesChange runs for the same interaction.
        const clickedId = getClickedAppNodeId(e);
        const selectedNodeIds = new Set(
          nodesRef.current.filter((n) => n.selected).map((n) => n.id),
        );
        shiftClickedNodeRef.current = clickedId;
        shiftSelectionBaseRef.current = selectedNodeIds;

        if (clickedId && selectedNodeIds.has(clickedId)) {
          e.preventDefault();
          e.stopPropagation();
          suppressNextClickRef.current = true;
          shiftSelectionBaseRef.current.clear();
          onNodesChange([{ type: "select", id: clickedId, selected: false }]);
        }
      }
    },
    [onNodesChange],
  );

  const handleContainerClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!suppressNextClickRef.current) {
      return;
    }

    suppressNextClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Intercept React Flow's node changes to:
  //   1. Drop 'select:true selectionGroup' batches (prevent phantom group selection).
  //   2. Filter ALL selectionGroup changes (including 'add' from StoreUpdater) so the
  //      group never leaks into the Zustand nodes store.
  //   3. During a bounding-box drag, re-select any base node that resetSelectedElements()
  //      spuriously cleared — unless that node is the one the user intentionally clicked.
  //   4. On a plain pane click (paneClickedRef=true), pass deselections straight through
  //      so the selection actually clears.
  const handleNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) => {
      // If React Flow is trying to select the group node, ignore the whole batch.
      const groupIsBeingSelected = changes.some(
        (c) =>
          "id" in c &&
          c.id === SELECTION_GROUP_ID &&
          c.type === "select" &&
          (c as NodeSelectionChange).selected,
      );
      if (groupIsBeingSelected) return;

      // Remove every change that targets the selectionGroup, including 'add' changes
      // emitted by StoreUpdater when it first reconciles the group into its nodeLookup.
      // 'add' changes use { type:'add', item } — no top-level 'id' — so we must check
      // item.id explicitly.
      const realChanges = changes.filter((c) => {
        if ("id" in c) return (c as { id: string }).id !== SELECTION_GROUP_ID;
        if (c.type === "add")
          return (
            (c as unknown as { item: AppNode }).item?.id !== SELECTION_GROUP_ID
          );
        return true;
      });

      if (realChanges.length === 0) return;

      const base = shiftSelectionBaseRef.current;
      // paneClickedRef is set by onPaneClick which fires *before* resetSelectedElements()
      // inside React Flow's onClick handler, so by the time we reach here on a pane click
      // the flag is already true — let the deselections through to clear the selection.
      if (base.size > 0 && !paneClickedRef.current) {
        const clickedId = shiftClickedNodeRef.current;
        // Re-select any base node that React Flow deselected, *except* the node the user
        // explicitly Shift+clicked (clickedId) — that one should be allowed to deselect.
        const baseDeselections = realChanges.filter(
          (c): c is NodeSelectionChange =>
            c.type === "select" &&
            !(c as NodeSelectionChange).selected &&
            base.has((c as NodeSelectionChange).id) &&
            (c as NodeSelectionChange).id !== clickedId,
        );
        if (baseDeselections.length > 0) {
          const reselections: NodeChange<AppNode>[] = baseDeselections.map(
            (c) => ({
              type: "select" as const,
              id: c.id,
              selected: true,
            }),
          );
          onNodesChange([...realChanges, ...reselections]);
          return;
        }
      }
      onNodesChange(realChanges);
    },
    [onNodesChange],
  );

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const { exportFlow, downloadExport } = await import("@/lib/export");
      const result = exportFlow(format, nodes);
      downloadExport(result);
    },
    [nodes],
  );

  const handleExportImage = useCallback(async () => {
    const { exportFlowAsImage } = await import("@/lib/export/image");
    await exportFlowAsImage(nodes, edges, projectName ?? "architecture");
  }, [nodes, edges, projectName]);

  const handleSave = useCallback(async () => {
    const uid = user?.uid ?? auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User must be signed in to save.");
    }

    const currentViewport = reactFlowInstance?.getViewport() ?? viewport;
    const nodesToSave = await persistLocalImageNodes(uid, nodes);
    const result = await saveArchitectureMutation.mutateAsync({
      architectureId: currentArchitectureId,
      name: projectName?.trim() || t.untitledArchitectureName,
      nodes: nodesToSave,
      edges,
      viewport: currentViewport,
    });

    setNodes(nodesToSave);
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
    setNodes,
    setCurrentArchitectureId,
    t.untitledArchitectureName,
    user?.uid,
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
    [currentArchitectureId, renameArchitectureMutation, setProjectName, user],
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

  const getCanvasCenterFlowPosition = useCallback(() => {
    if (!containerRef.current) {
      return null;
    }

    const bounds = containerRef.current.getBoundingClientRect();
    const screenCenter = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };

    if (reactFlowInstance) {
      return reactFlowInstance.screenToFlowPosition(screenCenter);
    }

    const currentViewport = viewport ?? { x: 0, y: 0, zoom: 1 };
    return {
      x: (bounds.width / 2 - currentViewport.x) / currentViewport.zoom,
      y: (bounds.height / 2 - currentViewport.y) / currentViewport.zoom,
    };
  }, [reactFlowInstance, viewport]);

  const addLocalImagesAtPosition = useCallback(
    (images: LocalImageAsset[], position: { x: number; y: number }) => {
      if (!images.length) {
        return;
      }

      commitGraphChange(({ nodes, edges }) => {
        const existingIds = new Set(nodes.map((node) => node.id));
        const nextImageNodes = images.map((image, index) => {
          let nodeId = `image-${imageIdRef.current++}`;
          while (existingIds.has(nodeId)) {
            nodeId = `image-${imageIdRef.current++}`;
          }
          existingIds.add(nodeId);

          const nodePosition = {
            x:
              position.x -
              image.width / 2 +
              index * IMAGE_PASTE_OFFSET.x,
            y:
              position.y -
              image.height / 2 +
              index * IMAGE_PASTE_OFFSET.y,
          };
          const parentedPosition = getParentedPosition(
            nodePosition,
            { width: image.width, height: image.height },
            nodes,
          );

          return {
            id: nodeId,
            type: "image",
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: {
              localAssetId: image.localAssetId,
              objectUrl: image.objectUrl,
              contentType: image.contentType,
              alt: t.pastedImageAlt,
              naturalWidth: image.naturalWidth,
              naturalHeight: image.naturalHeight,
            },
            style: {
              width: image.width,
              height: image.height,
            },
          } satisfies AppNode;
        });

        return {
          nodes: orderNodesForSubflows([
            ...nodes.map((node) => ({ ...node, selected: false })),
            ...nextImageNodes,
          ]),
          edges,
        };
      });
    },
    [commitGraphChange, t.pastedImageAlt],
  );

  const processPastedImages = useCallback(
    async (files: File[]) => {
      const position = getCanvasCenterFlowPosition();
      if (!position) {
        return;
      }

      try {
        const localImages = await Promise.all(
          files.map((file) => createLocalPastedImage(file)),
        );
        addLocalImagesAtPosition(localImages, position);
      } catch (error) {
        console.error(error);
        toast({
          title: t.pastedImageUploadFailed,
          description: t.pastedImageUploadFailedDescription,
          variant: "destructive",
        });
      }
    },
    [addLocalImagesAtPosition, getCanvasCenterFlowPosition, t, toast],
  );

  const handleAuthRequired = useCallback(() => {
    setPendingSave(true);
    setAuthDialogMounted(true);
    setAuthDialogOpen(true);
  }, []);

  const showPlacementScopeToast = useCallback(
    (serviceName: string, scope: PlacementScope) => {
      toast({
        title: serviceName,
        description: t.placementScopeToastDescription(
          t.placementScopeLabel(scope),
        ),
      });
    },
    [t, toast],
  );

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
        void instance.setViewport(viewport, { duration: 0 }).finally(() => {
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

      commitGraphChange(({ nodes: n, edges }) => {
        const selectedIds = n
          .filter((node) => node.selected && node.type !== "selectionGroup")
          .map((node) => node.id);
        const selectedIdSet = new Set(selectedIds);
        const shouldConnectSelection =
          selectedIds.length > 1 &&
          selectedIdSet.has(connection.source!) &&
          !selectedIdSet.has(connection.target!);

        if (shouldConnectSelection) {
          let result = edges;
          for (const sourceId of selectedIds) {
            const autoLabel = resolveVpnGatewayEdgeLabel(connection.target!, n);
            const edge: AppEdge = {
              ...connection,
              id: `edge-${edgeIdRef.current++}`,
              source: sourceId,
              target: connection.target!,
              style: EDGE_STYLE,
              ...(autoLabel && { label: autoLabel }),
            };
            result = addEdgeWithAzSync(edge, n, result);
          }
          return { nodes: n, edges: result };
        }

        const autoLabel = resolveVpnGatewayEdgeLabel(connection.target!, n);
        const edge: AppEdge = {
          ...connection,
          id: `edge-${edgeIdRef.current++}`,
          source: connection.source!,
          target: connection.target!,
          style: EDGE_STYLE,
          ...(autoLabel && { label: autoLabel }),
        };

        return {
          nodes: n,
          edges: addEdgeWithAzSync(edge, n, edges),
        };
      });
    },
    [commitGraphChange],
  );

  const onDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      // Read dataTransfer synchronously — only available inside the event handler
      const droppedTool =
        decodeDragTool(event.dataTransfer.getData(DND_MIME_TYPE)) ??
        activeDragToolRef.current;

      if (!droppedTool || !reactFlowInstance) {
        setDropTargetNodeId(null);
        setDropPreview(null);
        return;
      }

      // Throttle the expensive spatial computation to one frame at a time
      if (dragOverRafRef.current !== null) return;
      const clientX = event.clientX;
      const clientY = event.clientY;
      dragOverRafRef.current = requestAnimationFrame(() => {
        dragOverRafRef.current = null;

      const position = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });
      const { nodes: currentNodes, nodesById } = useFlowStore.getState();

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
        setDropPreview(
          target ? { parentId: target.id, childType: "vpc" } : null,
        );
        setDropBandSide(null);
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
        setDropPreview(
          target ? { parentId: target.id, childType: "az" } : null,
        );
        setDropBandSide(null);
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
        setDropBandSide(null);
        return;
      }

      if (droppedTool.type === "asg") {
        setDropTargetNodeId(null);
        setDropPreview(null);
        setDropBandSide(null);
        return;
      }

      // AWS service node (non-VPC): show band-side preview for scope-restricted services
      if (droppedTool.type === AWS_SERVICE_NODE_TYPE) {
        const service = AWS_SERVICES.find((s) => s.id === droppedTool.serviceId);
        const scope = service?.placementScope ?? "subnet";

        if (scope !== "subnet") {
          const nodeRect = {
            x: position.x - SERVICE_DROP_OFFSET.x,
            y: position.y - SERVICE_DROP_OFFSET.y,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
          };
          const allowedAncestor = findAllowedAncestorForScope(nodeRect, scope, currentNodes);
          if (allowedAncestor) {
            if (scope === "az") {
              setDropTargetNodeId(allowedAncestor.id);
              setDropBandSide(null);
              setDropPreview(null);
              return;
            }

            const ancPos = getAbsolutePosition(allowedAncestor, nodesById);
            const { width: ancW, height: ancH } = getNodeSize(allowedAncestor);
            const ancRect = { ...ancPos, width: ancW, height: ancH };
            const side = resolveBandSide(
              { x: position.x, y: position.y },
              ancRect,
              scope,
              service?.id,
            );
            setDropTargetNodeId(allowedAncestor.id);
            setDropBandSide(side);
          } else {
            setDropTargetNodeId(null);
            setDropBandSide(null);
          }
          setDropPreview(null);
          return;
        }

        // subnet-scope: highlight the deepest valid container as a standard drop target
        const nodeRect = {
          x: position.x - SERVICE_DROP_OFFSET.x,
          y: position.y - SERVICE_DROP_OFFSET.y,
          width: DEFAULT_NODE_WIDTH,
          height: DEFAULT_NODE_HEIGHT,
        };
        const target = findIntersectingContainer(nodeRect, currentNodes, nodesById);
        setDropTargetNodeId(target?.id ?? null);
        setDropPreview(null);
        setDropBandSide(null);
        return;
      }

      setDropTargetNodeId(null);
      setDropPreview(null);
      setDropBandSide(null);
      }); // end rAF
    },
    [
      reactFlowInstance,
      setDropBandSide,
      setDropPreview,
      setDropTargetNodeId,
      t.availabilityZone,
      t.subnet,
    ],
  );

  const addToolAtPosition = useCallback(
    (tool: DragTool, position: { x: number; y: number }, pulseKey?: string) => {
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
              (n) =>
                isRegionNode(n) &&
                isRectIntersecting(vpcRect, getNodeRect(n, nodesById)),
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
              return {
                nodes: redistributeGatewayAffectedVpcLayouts(
                  redistributeVpcNodes(parentRegion.id, rw, rh, allNodes),
                ),
                edges,
              };
            }
            return { nodes: redistributeGatewayAffectedVpcLayouts(allNodes), edges };
          });
          return;
        }

        const nodeId = `${service.id}-${serviceIdRef.current++}`;
        lastCreatedIdRef.current = nodeId;
        const nodePosition = {
          x: position.x - SERVICE_DROP_OFFSET.x,
          y: position.y - SERVICE_DROP_OFFSET.y,
        };
        let placementToastScope: PlacementScope | null = null;

        commitGraphChange(({ nodes, edges }) => {
          const nodeRect = { ...nodePosition, width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
          const serviceData = getAwsServiceNodeData(service);
          const scope = service.placementScope ?? serviceData.placementScope ?? "subnet";

          let parentedPosition: ReturnType<typeof getParentedPosition>;
          let extraData: Record<string, unknown> = {};

          if (scope === "subnet") {
            parentedPosition = getParentedPosition(nodePosition, { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }, nodes);
          } else {
            const nodesById = new Map(nodes.map((n) => [n.id, n]));
            const allowedAncestor = findAllowedAncestorForScope(nodeRect, scope, nodes);

            if (!allowedAncestor) {
              // global scope or no valid ancestor — place at canvas top-level, expelled from any region
              const safePos = expelGlobalNodePosition(
                nodePosition, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, nodes,
              );
              if (
                scope === "global" ||
                safePos.x !== nodePosition.x ||
                safePos.y !== nodePosition.y
              ) {
                placementToastScope = scope;
              }
              parentedPosition = { position: safePos };
            } else if (scope === "az") {
              placementToastScope = scope;
              const ancestorPosition = getAbsolutePosition(
                allowedAncestor,
                nodesById,
              );
              parentedPosition = {
                parentId: allowedAncestor.id,
                position: {
                  x: nodePosition.x - ancestorPosition.x,
                  y: nodePosition.y - ancestorPosition.y,
                },
              };
            } else {
              // Always place in the band of the allowed ancestor for non-subnet scope
              placementToastScope = scope;
              const dropAbsCenter = {
                x: nodePosition.x + DEFAULT_NODE_WIDTH / 2,
                y: nodePosition.y + DEFAULT_NODE_HEIGHT / 2,
              };
              const ancRect = {
                ...getAbsolutePosition(allowedAncestor, nodesById),
                width: (allowedAncestor.style as { width?: number })?.width ?? allowedAncestor.width ?? 720,
                height: (allowedAncestor.style as { height?: number })?.height ?? allowedAncestor.height ?? 480,
              };
              const side = resolveBandSide(dropAbsCenter, ancRect, scope, service.id);
              const bandPos = computeBandPlacement(allowedAncestor, side, nodes, service.id);
              parentedPosition = bandPos;
              extraData = { bandSide: side };
            }
          }

          const newNode: AppNode = {
            id: nodeId,
            type: getServiceNodeType(service.id),
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: { ...serviceData, ...extraData, ...pulseData },
          };

          const nextNodes = addNodeWithAzSync(
            newNode,
            nodes.map((n) => ({ ...n, selected: false })),
          );

          return {
            nodes: redistributeScopeAffectedLayouts(redistributeGatewayAffectedVpcLayouts(nextNodes)),
            edges,
          };
        });
        if (placementToastScope) {
          showPlacementScopeToast(service.name, placementToastScope);
        }
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

          return {
            nodes: addNodeWithAzSync(
              newNode,
              nodes.map((n) => ({ ...n, selected: false })),
            ),
            edges,
          };
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
            data: {
              label: t.internet,
              fields: { label: t.internet },
              ...pulseData,
            },
          };

          return {
            nodes: addNodeWithAzSync(
              newNode,
              nodes.map((n) => ({ ...n, selected: false })),
            ),
            edges,
          };
        });
        return;
      }

      if (tool.type === "web") {
        const nodeId = `web-${serviceIdRef.current++}`;
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
            type: "web",
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: { label: t.web, fields: { label: t.web }, ...pulseData },
          };
          return { nodes: addNodeWithAzSync(newNode, nodes.map((n) => ({ ...n, selected: false }))), edges };
        });
        return;
      }

      if (tool.type === "mobile") {
        const nodeId = `mobile-${serviceIdRef.current++}`;
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
            type: "mobile",
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: { label: t.mobile, fields: { label: t.mobile }, ...pulseData },
          };
          return { nodes: addNodeWithAzSync(newNode, nodes.map((n) => ({ ...n, selected: false }))), edges };
        });
        return;
      }

      if (tool.type === "database") {
        const nodeId = `database-${serviceIdRef.current++}`;
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
            type: "database",
            zIndex: 10,
            selected: true,
            ...parentedPosition,
            data: {
              label: t.database,
              fields: { label: t.database },
              ...pulseData,
            },
          };
          return {
            nodes: addNodeWithAzSync(
              newNode,
              nodes.map((n) => ({ ...n, selected: false })),
            ),
            edges,
          };
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

          return {
            nodes: addNodeWithAzSync(
              newNode,
              nodes.map((n) => ({ ...n, selected: false })),
            ),
            edges,
          };
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
          const parentContainer = findIntersectingContainer(
            azRect,
            nodes,
            nodesById,
            {
              id: azId,
              type: "networkContainer",
              position: azPosition,
              data: { containerType: "az", label: t.availabilityZone },
            },
          );
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
                  ? {
                      x: azPosition.x - parentPosition.x,
                      y: azPosition.y - parentPosition.y,
                    }
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

      if (tool.type === "genericContainer") {
        const containerNumber = containerIdRef.current++;
        const genericPosition = {
          x: position.x - CONTAINER_WIDTH / 2,
          y: position.y - CONTAINER_HEIGHT / 2,
        };
        const genericId = `container-generic-${containerNumber}`;

        commitGraphChange(({ nodes, edges }) => ({
          nodes: orderNodesForSubflows([
            ...nodes.map((n) => ({ ...n, selected: false })),
            {
              id: genericId,
              type: "networkContainer",
              selected: true,
              position: genericPosition,
              data: {
                containerType: "generic" as const,
                label: "Container",
                ...pulseData,
              },
              style: {
                width: CONTAINER_WIDTH,
                height: CONTAINER_HEIGHT,
              },
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
              .filter(
                (node) => node.parentId === parentVpc.id && isSubnetNode(node),
              )
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
    [commitGraphChange, setInspectorOpen, showPlacementScopeToast, t],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      if (dragOverRafRef.current !== null) {
        cancelAnimationFrame(dragOverRafRef.current);
        dragOverRafRef.current = null;
      }
      activeDragToolRef.current = null;
      setDropTargetNodeId(null);
      setDropPreview(null);
      setDropBandSide(null);

      const droppedTool =
        decodeDragTool(event.dataTransfer.getData(DND_MIME_TYPE)) ??
        activeDragToolRef.current;
      if (!droppedTool || !reactFlowInstance) {
        return;
      }

      lastCreatedIdRef.current = null;
      addToolAtPosition(
        droppedTool,
        reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      );

      // Pan to show expelled/out-of-view nodes after drop
      const createdId = lastCreatedIdRef.current;
      if (createdId) {
        const { nodesById: updatedById } = useFlowStore.getState();
        const newNode = updatedById.get(createdId);
        if (newNode) {
          const absPos = getAbsolutePosition(newNode, updatedById);
          const screenPos = reactFlowInstance.flowToScreenPosition(absPos);
          const inView =
            screenPos.x > -DEFAULT_NODE_WIDTH &&
            screenPos.x < window.innerWidth + DEFAULT_NODE_WIDTH &&
            screenPos.y > -DEFAULT_NODE_HEIGHT &&
            screenPos.y < window.innerHeight + DEFAULT_NODE_HEIGHT;
          if (!inView) {
            const { zoom } = reactFlowInstance.getViewport();
            reactFlowInstance.setCenter(
              absPos.x + DEFAULT_NODE_WIDTH / 2,
              absPos.y + DEFAULT_NODE_HEIGHT / 2,
              { zoom, duration: 300 },
            );
          }
        }
      }
    },
    [addToolAtPosition, reactFlowInstance, setDropBandSide, setDropPreview, setDropTargetNodeId],
  );

  const handleToolDragStart = useCallback((tool: DragTool) => {
    activeDragToolRef.current = tool;
  }, []);

  const handleToolDragEnd = useCallback(() => {
    if (dragOverRafRef.current !== null) {
      cancelAnimationFrame(dragOverRafRef.current);
      dragOverRafRef.current = null;
    }
    activeDragToolRef.current = null;
    setDropTargetNodeId(null);
    setDropPreview(null);
    setDropBandSide(null);
  }, [setDropBandSide, setDropPreview, setDropTargetNodeId]);

  const handlePasteImages = useCallback(
    (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const imageFiles = getClipboardImageFiles(event);
      if (!imageFiles.length) {
        return;
      }

      event.preventDefault();
      void processPastedImages(imageFiles);
    },
    [processPastedImages],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePasteImages);
    return () => window.removeEventListener("paste", handlePasteImages);
  }, [handlePasteImages]);

  const addToolAtViewportCenter = useCallback(
    (tool: DragTool) => {
      const position = getCanvasCenterFlowPosition();
      if (!position) {
        return;
      }

      addToolAtPosition(
        tool,
        position,
        `${CLICK_PULSE_PREFIX}-${pulseIdRef.current++}`,
      );
    },
    [addToolAtPosition, getCanvasCenterFlowPosition],
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
          {
            oldParentId?: string;
            childType: ReturnType<typeof getNetworkContainerType>;
          }
        >();

        function getUpdatedNode(node: AppNode) {
          return updates.get(node.id) ?? node;
        }

        function updateContainerForNode(
          node: AppNode,
          forcedContainer?: AppNode,
        ) {
          const nodeRect = getNodeRect(node, nodesById);

          // For service nodes with a placement scope, enforce placement rules on drag.
          if (!isNetworkContainerNode(node) && node.type === "awsService") {
            const awsNode = node as import("@/components/nodes/AwsServiceNode").AwsServiceNodeType;
            const scope = getNodePlacementScope(awsNode);

            if (scope !== "subnet") {
              const allowedAncestor = findAllowedAncestorForScope(nodeRect, scope, nodes);

              if (scope === "global" || !allowedAncestor) {
                // Expel to canvas top-level, moving outside any region bounds
                const safePos = expelGlobalNodePosition(
                  { x: nodeRect.x, y: nodeRect.y },
                  nodeRect.width,
                  nodeRect.height,
                  nodes,
                );
                const posChanged = safePos.x !== nodeRect.x || safePos.y !== nodeRect.y;
                if (node.parentId || posChanged) {
                  updates.set(node.id, {
                    ...node,
                    parentId: undefined,
                    data: { ...node.data, bandSide: undefined },
                    position: safePos,
                  });
                }
                return;
              }

              if (scope === "az") {
                if (
                  node.parentId !== allowedAncestor.id ||
                  (node.data as { bandSide?: string }).bandSide
                ) {
                  const ancPos = getAbsolutePosition(allowedAncestor, nodesById);
                  updates.set(node.id, {
                    ...node,
                    parentId: allowedAncestor.id,
                    data: { ...node.data, bandSide: undefined },
                    position: {
                      x: nodeRect.x - ancPos.x,
                      y: nodeRect.y - ancPos.y,
                    },
                  });
                }
                return;
              }

              // Determine if it's being dropped deeper than allowed
              const deepestContainer = findIntersectingContainer(nodeRect, containerNodes, nodesById, node);
              const isExpelled = deepestContainer && deepestContainer.id !== allowedAncestor.id;

              if (isExpelled) {
                const dropAbsCenter = {
                  x: nodeRect.x + nodeRect.width / 2,
                  y: nodeRect.y + nodeRect.height / 2,
                };
                const ancRect = {
                  ...getAbsolutePosition(allowedAncestor, nodesById),
                  width: (allowedAncestor.style as { width?: number })?.width ?? allowedAncestor.width ?? 720,
                  height: (allowedAncestor.style as { height?: number })?.height ?? allowedAncestor.height ?? 480,
                };
                const side = resolveBandSide(dropAbsCenter, ancRect, scope, awsNode.data.serviceId);
                const existingNodes = nodes.filter((n) => n.id !== node.id);
                const bandPlacement = computeBandPlacement(
                  allowedAncestor,
                  side,
                  existingNodes,
                  awsNode.data.serviceId,
                );
                updates.set(node.id, {
                  ...node,
                  parentId: allowedAncestor.id,
                  data: { ...node.data, bandSide: side },
                  position: bandPlacement.position,
                });
                return;
              }

              // Drop is within the allowed ancestor — normal parent assignment
              if (node.parentId !== allowedAncestor.id) {
                const ancPos = getAbsolutePosition(allowedAncestor, nodesById);
                updates.set(node.id, {
                  ...node,
                  parentId: allowedAncestor.id,
                  data: { ...node.data, bandSide: undefined },
                  position: { x: nodeRect.x - ancPos.x, y: nodeRect.y - ancPos.y },
                });
              }
              return;
            }
          }

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
        for (const [
          draggedNodeId,
          { oldParentId, childType },
        ] of reparentedContainers) {
          const newParentId = updates.get(draggedNodeId)?.parentId;
          const parentsToRedistribute = new Set<string>();
          if (newParentId) parentsToRedistribute.add(newParentId);
          if (oldParentId && oldParentId !== newParentId)
            parentsToRedistribute.add(oldParentId);

          if (childType) {
            for (const parentId of parentsToRedistribute) {
              result = redistributeChildContainers(parentId, childType, result);
            }
          }
        }

        const syncedNodes = draggedNodes.reduce(
          (currentNodes, draggedNode) =>
            isNetworkContainerNode(draggedNode)
              ? currentNodes
              : syncNodeGroupPosition(draggedNode.id, currentNodes),
          result,
        );

        return redistributeScopeAffectedLayouts(redistributeGatewayAffectedVpcLayouts(syncedNodes));
      });
    },
    [setNodes],
  );

  const onNodeDrag: OnNodeDrag<AppNode> = useCallback(
    (_event, node) => {
      if (!isNetworkContainerNode(node)) {
        if (node.type === "awsService") {
          const awsNode = node as import("@/components/nodes/AwsServiceNode").AwsServiceNodeType;
          const scope = getNodePlacementScope(awsNode);

          if (scope !== "subnet") {
            const { nodes: currentNodes, nodesById } = useFlowStore.getState();
            const nodeRect = getNodeRect(node, nodesById);
            const allowedAncestor = findAllowedAncestorForScope(nodeRect, scope, currentNodes);

            if (allowedAncestor) {
              if (scope === "az") {
                setDropTargetNodeId(allowedAncestor.id);
                setDropBandSide(null);
                setDropPreview(null);
                return;
              }

              const ancPos = getAbsolutePosition(allowedAncestor, nodesById);
              const { width: ancW, height: ancH } = getNodeSize(allowedAncestor);
              const side = resolveBandSide(
                {
                  x: nodeRect.x + nodeRect.width / 2,
                  y: nodeRect.y + nodeRect.height / 2,
                },
                { ...ancPos, width: ancW, height: ancH },
                scope,
                awsNode.data.serviceId,
              );
              setDropTargetNodeId(allowedAncestor.id);
              setDropBandSide(side);
              setDropPreview(null);
              return;
            }

            setDropBandSide(null);
          }
        }
        if (dropTargetNodeId !== null) setDropTargetNodeId(null);
        setDropPreview(null);
        return;
      }

      const {
        nodesById,
        containerNodes,
      } = useFlowStore.getState();

      const nodeRect = getNodeRect(node, nodesById);
      const target = findIntersectingContainer(
        nodeRect,
        containerNodes,
        nodesById,
        node,
      );
      const childType = getNetworkContainerType(node);
      const isNewParent = target && target.id !== node.parentId;

      setDropTargetNodeId(isNewParent ? target.id : null);
      setDropBandSide(null);
      setDropPreview(
        isNewParent && childType ? { parentId: target.id, childType } : null,
      );
    },
    [dropTargetNodeId, setDropBandSide, setDropPreview, setDropTargetNodeId],
  );

  const onNodeDragStop: OnNodeDrag<AppNode> = useCallback(
    (_event, node, draggedNodes) => {
      setDropTargetNodeId(null);
      setDropPreview(null);
      setDropBandSide(null);
      syncNodeSubnet(
        draggedNodes.length
          ? draggedNodes.map((draggedNode) => draggedNode.id)
          : [node.id],
      );
    },
    [syncNodeSubnet, setDropBandSide, setDropPreview, setDropTargetNodeId],
  );

  const handleSelectionStart = useCallback(
    (event: MouseEvent<Element>) => {
      setSelectionDragActive(true);
      // Snapshot which containers were already selected before this drag.
      // nodesRef.current still reflects pre-reset state here (useEffect hasn't re-run).
      preDragContainersRef.current = event.shiftKey
        ? new Set(
            nodesRef.current
              .filter((n) => n.type === "networkContainer" && n.selected)
              .map((n) => n.id),
          )
        : new Set();
      setSelectionBoxActive(false);
    },
    [setSelectionBoxActive],
  );

  const handleSelectionEnd = useCallback(() => {
    setSelectionDragActive(false);
    shiftSelectionBaseRef.current.clear();
    setSelectionBoxActive(true);
  }, [setSelectionBoxActive]);

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
    const visibleNodes =
      suppressedContainerSelectionIds.size === 0
        ? nodes
        : nodes.map((node) => {
            if (!suppressedContainerSelectionIds.has(node.id)) return node;
            return { ...node, selected: false };
          });

    const eligible = visibleNodes.filter(
      (n) => n.selected && n.type !== "selectionGroup",
    );
    if (selectionDragActive || eligible.length < 2) return visibleNodes;
    const nodesById = new Map(visibleNodes.map((n) => [n.id, n]));
    const rects = eligible.map((n) => getNodeRect(n, nodesById));
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.width));
    const maxY = Math.max(...rects.map((r) => r.y + r.height));
    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
    const w = bounds.width + SELECTION_BOX_PADDING * 2;
    const h = bounds.height + SELECTION_BOX_PADDING * 2;
    const groupNode = {
      id: SELECTION_GROUP_ID,
      type: "selectionGroup" as const,
      position: {
        x: bounds.x - SELECTION_BOX_PADDING,
        y: bounds.y - SELECTION_BOX_PADDING,
      },
      data: {} as Record<string, never>,
      style: { width: w, height: h },
      // Pre-supply measured dimensions so React Flow doesn't set visibility:hidden
      // while waiting for ResizeObserver to report the node's size.
      measured: { width: w, height: h },
      draggable: false,
      zIndex: 1000,
    };
    return [...visibleNodes, groupNode];
  }, [nodes, selectionDragActive, suppressedContainerSelectionIds]);

  return (
    <>
      <DragDropSidebar
        labels={{
          dragAndDrop: t.dragAndDrop,
          dragOrClickToAdd: t.dragOrClickToAdd,
          dragText: t.dragText,
          text: t.text,
          textDescription: t.textDescription,
          dragService: t.dragService,
          getServiceDescription: (service) =>
            getServiceDescription(service, locale),
        }}
        infraLabels={Object.fromEntries(
          INFRASTRUCTURE_ITEMS.map((item) => [
            item.id,
            {
              name: t[item.tooltipKey as keyof typeof t] as string,
              description: t[item.descriptionKey as keyof typeof t] as string,
            },
          ]),
        )}
        onToolClick={addToolAtViewportCenter}
        onToolDragStart={handleToolDragStart}
        onToolDragEnd={handleToolDragEnd}
      />
      <div
        ref={containerRef}
        tabIndex={-1}
        style={{ flex: 1, position: "relative" }}
        onPointerDownCapture={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          handleContainerPointerDown(event);
        }}
        onClickCapture={handleContainerClick}
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
          onSelectionStart={handleSelectionStart}
          onSelectionEnd={handleSelectionEnd}
          onPaneClick={() => {
            paneClickedRef.current = true;
            setSelectionBoxActive(false);
          }}
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
          <ServiceSearch onToolClick={addToolAtViewportCenter} />
          <SelectionToolbar hidden={selectionDragActive} />
          <ContainerSelectionGuard
            preDragContainersRef={preDragContainersRef}
            setSuppressedContainerSelectionIds={
              setSuppressedContainerSelectionIds
            }
          />
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
              exportImage: t.exportImage,
              exportDisclaimerTitle: t.exportDisclaimerTitle,
              exportDisclaimerDescription: t.exportDisclaimerDescription,
              exportDisclaimerAction: t.exportDisclaimerAction,
              exportDisclaimerCancel: t.exportDisclaimerCancel,
            }}
            onExport={handleExport}
            onExportImage={handleExportImage}
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
