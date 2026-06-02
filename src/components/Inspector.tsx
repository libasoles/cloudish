import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AwsServiceNodeType, type AwsServiceNodeData } from "@/components/AwsServiceNode";
import { type PlainTextNodeData } from "@/components/PlainTextNode";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { isNetworkContainerNode, getNetworkContainerType } from "@/lib/graph-utils";
import { getServiceDescription } from "@/lib/node-utils";
import { ContainerInspectorRouter } from "@/components/inspector/ContainerInspectorRouter";
import { EdgeInspectorPanel } from "@/components/inspector/EdgeInspectorPanel";
import { PlainTextInspectorPanel } from "@/components/inspector/PlainTextInspectorPanel";
import { AwsServiceInspectorPanel } from "@/components/inspector/AwsServiceInspectorPanel";

export default function Inspector() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as typeof UI_TEXT["en"];
  const { nodes, edges, inspectorOpen } = useFlowStore();

  if (!inspectorOpen) return null;

  const selectedNode = nodes.find((n) => n.selected);
  const selectedEdge = edges.find((edge) => edge.selected);
  const hasCanvasNodes = nodes.length > 0;

  const selectedContainerType = selectedNode
    ? getNetworkContainerType(selectedNode)
    : null;

  const selectedAwsNode =
    selectedNode?.type === "awsService"
      ? (selectedNode as AwsServiceNodeType)
      : null;
  const selectedPlainTextNode =
    selectedNode?.type === "plainText" ? selectedNode : null;
  const selectedPlainTextData =
    (selectedPlainTextNode?.data as PlainTextNodeData | undefined) ?? null;

  const selectedAwsDescription = selectedAwsNode
    ? getServiceDescription(selectedAwsNode, locale)
    : "";

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
    if (selectedNode || selectedEdge) return selectedLabel;
    if (!hasCanvasNodes) return t.emptyCanvasTitle;
    return t.noNodeSelected;
  })();

  return (
    <Card className="flex h-full w-72 flex-col rounded-none border-y-0 border-r-0">
      <CardHeader className="px-4 py-4">
        <CardTitle className="text-sm font-medium">{inspectorTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden px-4">
        <div className="flex-1 overflow-y-auto px-0.5">
          {!selectedNode && selectedEdge ? (
            <EdgeInspectorPanel edge={selectedEdge} />
          ) : selectedPlainTextNode ? (
            <PlainTextInspectorPanel node={selectedPlainTextNode} />
          ) : selectedNode &&
            isNetworkContainerNode(selectedNode) &&
            selectedContainerType ? (
            <ContainerInspectorRouter
              node={selectedNode}
              containerType={selectedContainerType}
            />
          ) : selectedAwsNode ? (
            <AwsServiceInspectorPanel node={selectedAwsNode} />
          ) : selectedNode ? null : (
            <div className="flex flex-col items-center gap-4 pt-6 text-center">
              <img
                src="/cloudish-logo.png"
                alt={t.appLogoAlt}
                className="h-auto w-32"
              />
              <p className="text-sm leading-5 text-muted-foreground">
                {hasCanvasNodes ? t.clickNodeDetails : t.emptyCanvasDescription}
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
