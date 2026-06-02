import { lazy, Suspense, useState } from "react";
import { FolderOpen, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type AwsServiceNodeType,
  type AwsServiceNodeData,
} from "@/components/AwsServiceNode";
import { type PlainTextNodeData } from "@/components/PlainTextNode";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { useFlowStore } from "@/store/flowStore";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/auth";
import { useArchitectures } from "@/hooks/useArchitectures";
import {
  isNetworkContainerNode,
  getNetworkContainerType,
} from "@/lib/graph-utils";
import { getServiceDescription } from "@/lib/node-utils";
import { ContainerInspectorRouter } from "@/components/inspector/ContainerInspectorRouter";
import { EdgeInspectorPanel } from "@/components/inspector/EdgeInspectorPanel";
import { PlainTextInspectorPanel } from "@/components/inspector/PlainTextInspectorPanel";
import { AwsServiceInspectorPanel } from "@/components/inspector/AwsServiceInspectorPanel";
import { SavedProjectsList } from "@/components/inspector/SavedProjectsList";
const AuthDialog = lazy(() => import("@/components/AuthDialog"));

export default function Inspector() {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as (typeof UI_TEXT)["en"];
  const { nodes, edges, inspectorOpen } = useFlowStore();
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMounted, setAuthDialogMounted] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">(
    "login",
  );
  const [savedProjectsOpen, setSavedProjectsOpen] = useState(false);
  const { data: architectures, isLoading: archLoading } = useArchitectures();
  const archCount = architectures?.length ?? null;

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
            <div className="flex flex-col gap-4">
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
              {!hasCanvasNodes && user && <SavedProjectsList />}
            </div>
          )}
        </div>
        {selectedAwsNode && selectedAwsDescription && (
          <div className="my-4 border-t border-border pt-4 text-sm leading-5 text-muted-foreground">
            {selectedAwsDescription}
          </div>
        )}
        <div className="mt-auto border-t border-border pt-3">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-xs text-muted-foreground">
                <span className="block">{t.authSignedInAs}</span>
                <span className="block truncate font-medium text-foreground">
                  {user.email}
                </span>
              </p>
              <div className="flex shrink-0 items-center gap-0.5">
                <TooltipProvider>
                  <Popover open={savedProjectsOpen} onOpenChange={setSavedProjectsOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={archLoading || archCount === 0}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">{t.savedProjects}</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="top" align="end" className="p-3">
                      <SavedProjectsList onSelect={() => setSavedProjectsOpen(false)} />
                    </PopoverContent>
                  </Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => signOutUser()}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t.signOut}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {t.authSavePrompt}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setAuthInitialMode("login");
                    setAuthDialogMounted(true);
                    setAuthDialogOpen(true);
                  }}
                >
                  {t.signIn}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setAuthInitialMode("register");
                    setAuthDialogMounted(true);
                    setAuthDialogOpen(true);
                  }}
                >
                  {t.signUp}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {authDialogMounted && (
        <Suspense fallback={null}>
          <AuthDialog
            open={authDialogOpen}
            onOpenChange={setAuthDialogOpen}
            initialMode={authInitialMode}
          />
        </Suspense>
      )}
    </Card>
  );
}
