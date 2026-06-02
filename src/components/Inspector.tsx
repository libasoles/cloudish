import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AwsServiceNodeType, type AwsServiceNodeData } from "@/components/AwsServiceNode";
import { type PlainTextNodeData } from "@/components/PlainTextNode";
import {
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
  getTextFontSizeForNodeSize,
  getTextNodeSizeForFont,
} from "@/lib/text-node-utils";
import {
  setEdgeArrowDirection,
  type EdgeArrowDirection,
} from "@/lib/edge-tools";
import type { SubnetNodeData, SubnetType } from "@/types/flow";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import {
  isNetworkContainerNode,
  isSubnetNode,
  getNodeSize,
  getNetworkContainerType,
} from "@/lib/graph-utils";
import {
  getServiceDescription,
  type FieldValue,
} from "@/lib/node-utils";
import { updateSyncedEdgeGroup, updateSyncedNodeGroup } from "@/lib/az-sync";
import { setManagedChildCount } from "@/lib/network-topology/managed-children";
import { ContainerInspectorRouter } from "@/components/inspector/ContainerInspectorRouter";
import { EdgeInspectorPanel } from "@/components/inspector/EdgeInspectorPanel";
import { PlainTextInspectorPanel } from "@/components/inspector/PlainTextInspectorPanel";
import { AwsServiceInspectorPanel } from "@/components/inspector/AwsServiceInspectorPanel";

function clampTextFontSize(fontSize: number) {
  return Math.max(MIN_TEXT_FONT_SIZE, Math.min(MAX_TEXT_FONT_SIZE, fontSize));
}

function getDerivedTextFontSize(node: Parameters<typeof getNodeSize>[0]) {
  const { width, height } = getNodeSize(node);
  return getTextFontSizeForNodeSize(width, height);
}

export default function Inspector() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as typeof UI_TEXT["en"];
  const {
    nodes,
    edges,
    inspectorOpen,
    setNodes,
    setEdges,
    commitGraphChange,
    toggleAzSync,
  } = useFlowStore();

  const onChildCountChange = useCallback(
    (nodeId: string, count: number) => {
      commitGraphChange((state) =>
        setManagedChildCount(nodeId, count, state.nodes, state.edges, t.subnetLabel),
      );
    },
    [commitGraphChange, t.subnetLabel],
  );

  const onSubnetTypeChange = useCallback(
    (nodeId: string, subnetType: SubnetType) => {
      const typeLabel = subnetType === "Public" ? t.public : t.private;
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          const currentLabel = String(
            (node.data as Partial<SubnetNodeData>).label ?? "",
          );
          const labelIndex = Number(currentLabel.match(/\d+$/)?.[0] ?? 1);
          return {
            ...node,
            data: {
              ...node.data,
              label: t.subnetLabel(typeLabel, labelIndex),
              subnetType,
            },
          };
        }),
      );
    },
    [setNodes, t],
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

  const onContainerFieldChange = useCallback(
    (nodeId: string, fieldKey: string, value: FieldValue) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              fields: {
                ...(node.data as { fields?: Record<string, FieldValue> }).fields,
                [fieldKey]: value,
              },
            },
          };
        }),
      );
    },
    [setNodes],
  );

  const onServiceFieldChange = useCallback(
    (nodeId: string, fieldKey: string, value: FieldValue) => {
      setNodes((nodes) =>
        updateSyncedNodeGroup(nodeId, nodes, (node) => {
          const data = node.data as { fields?: Record<string, FieldValue> };
          return {
            ...node,
            data: { ...data, fields: { ...data.fields, [fieldKey]: value } },
          };
        }),
      );
    },
    [setNodes],
  );

  const onPlainTextChange = useCallback(
    (nodeId: string, text: string) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, text } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const onPlainTextFontSizeChange = useCallback(
    (nodeId: string, fontSize: number) => {
      const nextFontSize = clampTextFontSize(fontSize);
      const nextSize = getTextNodeSizeForFont(nextFontSize);
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                width: nextSize.width,
                height: nextSize.height,
                style: {
                  ...node.style,
                  width: nextSize.width,
                  height: nextSize.height,
                },
                data: { ...node.data, fontSize: nextFontSize },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const onEdgeLabelChange = useCallback(
    (edgeId: string, label: string) => {
      setEdges((edges) =>
        updateSyncedEdgeGroup(edgeId, edges, (edge) => ({ ...edge, label })),
      );
    },
    [setEdges],
  );

  const onEdgeArrowDirectionChange = useCallback(
    (edgeId: string, direction: EdgeArrowDirection) => {
      setEdges((edges) =>
        updateSyncedEdgeGroup(edgeId, edges, (edge) =>
          setEdgeArrowDirection(edge, direction),
        ),
      );
    },
    [setEdges],
  );

  if (!inspectorOpen) return null;

  const selectedNode = nodes.find((n) => n.selected);
  const selectedEdge = edges.find((edge) => edge.selected);
  const hasCanvasNodes = nodes.length > 0;

  const selectedContainerType = selectedNode
    ? getNetworkContainerType(selectedNode)
    : null;

  const selectedAzParentId =
    selectedContainerType === "az" ? selectedNode?.parentId : undefined;
  const selectedAzHasSiblings =
    selectedContainerType === "az" &&
    selectedAzParentId != null &&
    nodes.filter(
      (n) =>
        n.parentId === selectedAzParentId &&
        (n.data as { containerType?: string }).containerType === "az",
    ).length > 1;
  const selectedAzSynced =
    selectedContainerType === "az"
      ? Boolean((selectedNode?.data as { synced?: boolean })?.synced)
      : false;

  const selectedAwsNode =
    selectedNode?.type === "awsService"
      ? (selectedNode as AwsServiceNodeType)
      : null;
  const selectedPlainTextNode =
    selectedNode?.type === "plainText" ? selectedNode : null;
  const selectedPlainTextData =
    (selectedPlainTextNode?.data as PlainTextNodeData | undefined) ?? null;
  const selectedPlainTextFontSize =
    selectedPlainTextNode && selectedPlainTextData
      ? Math.round(
          selectedPlainTextData.fontSize ??
            getDerivedTextFontSize(selectedPlainTextNode),
        )
      : MIN_TEXT_FONT_SIZE;

  const selectedAwsDescription = selectedAwsNode
    ? getServiceDescription(selectedAwsNode, locale)
    : "";
  const selectedContainerFields =
    (selectedNode?.data as { fields?: Record<string, FieldValue> } | undefined)
      ?.fields ?? {};

  const childVpcCount = selectedNode
    ? nodes.filter(
        (n) =>
          n.parentId === selectedNode.id &&
          getNetworkContainerType(n) === "vpc",
      ).length
    : 0;
  const childAzCount = selectedNode
    ? nodes.filter(
        (n) =>
          n.parentId === selectedNode.id &&
          getNetworkContainerType(n) === "az",
      ).length
    : 0;
  const childSubnetCount = selectedNode
    ? nodes.filter((n) => n.parentId === selectedNode.id && isSubnetNode(n))
        .length
    : 0;

  let selectedLabel = "";
  if (selectedNode?.type === "awsService") {
    selectedLabel = (selectedNode.data as AwsServiceNodeData).name;
  } else if (selectedNode?.type === "plainText") {
    selectedLabel = selectedPlainTextData?.text.trim() || t.text;
  } else if (selectedNode) {
    selectedLabel = String(
      (selectedNode.data as { label?: unknown })?.label ?? "",
    );
  }

  const inspectorTitle = (() => {
    if (!selectedNode && selectedEdge) {
      return (
        <>
          {t.edge}
          <br />
          <span className="font-normal text-muted-foreground">
            {selectedEdge.source} → {selectedEdge.target}
          </span>
        </>
      );
    }

    if (selectedNode || selectedEdge) {
      return selectedLabel;
    }

    if (!hasCanvasNodes) {
      return t.emptyCanvasTitle;
    }

    return t.noNodeSelected;
  })();

  return (
    <Card className="flex h-full w-72 flex-col rounded-none border-y-0 border-r-0">
      <CardHeader className="px-4 py-4">
        <CardTitle className="text-sm font-medium">
          {inspectorTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden px-4">
        <div className="flex-1 overflow-y-auto px-0.5">
          {!selectedNode && selectedEdge ? (
            <EdgeInspectorPanel
              edge={selectedEdge}
              onLabelChange={(label) =>
                onEdgeLabelChange(selectedEdge.id, label)
              }
              onArrowDirectionChange={(dir) =>
                onEdgeArrowDirectionChange(selectedEdge.id, dir)
              }
              t={t}
            />
          ) : selectedPlainTextNode && selectedPlainTextData ? (
            <PlainTextInspectorPanel
              text={selectedPlainTextData.text}
              fontSize={selectedPlainTextFontSize}
              onTextChange={(text) =>
                onPlainTextChange(selectedPlainTextNode.id, text)
              }
              onFontSizeChange={(fontSize) =>
                onPlainTextFontSizeChange(selectedPlainTextNode.id, fontSize)
              }
              t={t}
            />
          ) : selectedNode &&
            isNetworkContainerNode(selectedNode) &&
            selectedContainerType ? (
            <ContainerInspectorRouter
              containerType={selectedContainerType}
              regionProps={{
                node: selectedNode,
                childCount: childVpcCount,
                containerFields: selectedContainerFields,
                onChildCountChange: (count) =>
                  onChildCountChange(selectedNode.id, count),
                onContainerFieldChange: (key, value) =>
                  onContainerFieldChange(selectedNode.id, key, value),
                onRegionChange: (region) =>
                  onRegionChange(selectedNode.id, region),
                t,
              }}
              vpcProps={{
                childCount: childAzCount,
                containerFields: selectedContainerFields,
                onChildCountChange: (count) =>
                  onChildCountChange(selectedNode.id, count),
                onContainerFieldChange: (key, value) =>
                  onContainerFieldChange(selectedNode.id, key, value),
                t,
              }}
              azProps={{
                childCount: childSubnetCount,
                containerFields: selectedContainerFields,
                onChildCountChange: (count) =>
                  onChildCountChange(selectedNode.id, count),
                onContainerFieldChange: (key, value) =>
                  onContainerFieldChange(selectedNode.id, key, value),
                onToggleAzSync: (synced) =>
                  toggleAzSync(selectedNode.id, synced),
                azHasSiblings: selectedAzHasSiblings,
                azSynced: selectedAzSynced,
                t,
              }}
              subnetProps={{
                node: selectedNode,
                containerFields: selectedContainerFields,
                onContainerFieldChange: (key, value) =>
                  onContainerFieldChange(selectedNode.id, key, value),
                onSubnetTypeChange: (type) =>
                  onSubnetTypeChange(selectedNode.id, type),
                t,
              }}
            />
          ) : selectedAwsNode ? (
            <AwsServiceInspectorPanel
              node={selectedAwsNode}
              locale={locale}
              onFieldChange={(key, value) =>
                onServiceFieldChange(selectedAwsNode.id, key, value)
              }
              t={t}
            />
          ) : selectedNode ? null : (
            <div className="flex flex-col items-center gap-4 pt-6 text-center">
              <img
                src="/cloudish-logo.png"
                alt={t.appLogoAlt}
                className="h-auto w-32"
              />
              <p className="text-sm leading-5 text-muted-foreground">
                {hasCanvasNodes
                  ? t.clickNodeDetails
                  : t.emptyCanvasDescription}
              </p>
            </div>
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
