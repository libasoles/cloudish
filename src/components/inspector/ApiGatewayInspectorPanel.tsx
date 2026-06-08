import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { updateSyncedNodeGroup } from "@/lib/az-sync";
import { useFlowStore } from "@/store/flowStore";
import type { AwsServiceNodeType } from "@/components/nodes/AwsServiceNode";
import type { ApiGatewayRoute, HttpMethod } from "@/types/flow";
import { AwsServiceInspectorPanel } from "@/components/inspector/AwsServiceInspectorPanel";

const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
  "ANY",
];

function emptyRoute(): ApiGatewayRoute {
  return { id: crypto.randomUUID(), method: "GET", path: "" };
}

type Props = {
  node: AwsServiceNodeType;
};

export function ApiGatewayInspectorPanel({ node }: Props) {
  const setNodes = useFlowStore((s) => s.setNodes);
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as typeof UI_TEXT["en"];

  const [routes, setRoutes] = useState<ApiGatewayRoute[]>(() =>
    node.data.routes?.length
      ? node.data.routes
      : [emptyRoute(), { ...emptyRoute(), method: "POST" as HttpMethod }],
  );

  const persistRoutes = useCallback(
    (nextRoutes: ApiGatewayRoute[]) => {
      setNodes((nodes) =>
        updateSyncedNodeGroup(node.id, nodes, (n) => ({
          ...n,
          data: { ...n.data, routes: nextRoutes },
        })),
      );
    },
    [setNodes, node.id],
  );

  function changeMethod(id: string, method: HttpMethod) {
    const next = routes.map((r) => (r.id === id ? { ...r, method } : r));
    setRoutes(next);
    persistRoutes(next);
  }

  function changePath(id: string, path: string) {
    const next = routes.map((r) => (r.id === id ? { ...r, path } : r));
    setRoutes(next);
    persistRoutes(next);
  }

  function addRoute() {
    const next = [...routes, emptyRoute()];
    setRoutes(next);
    persistRoutes(next);
  }

  function removeRoute(id: string) {
    const next = routes.filter((r) => r.id !== id);
    setRoutes(next);
    persistRoutes(next);
  }

  return (
    <div className="space-y-4">
      <AwsServiceInspectorPanel node={node} />
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-sm font-medium text-foreground">{t.apiGatewayRoutes}</p>
        {routes.map((route) => (
          <div key={route.id} className="flex items-center gap-2">
            <Select
              value={route.method}
              onValueChange={(v) => changeMethod(route.id, v as HttpMethod)}
            >
              <SelectTrigger className="w-28 font-normal shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1 min-w-0 placeholder:text-muted-foreground/40"
              placeholder={t.apiGatewayRoutePathPlaceholder}
              value={route.path}
              onChange={(e) => changePath(route.id, e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => removeRoute(route.id)}
              aria-label={t.apiGatewayRemoveRoute}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={addRoute}
        >
          <Plus className="h-4 w-4" />
          {t.apiGatewayAddRoute}
        </Button>
      </div>
    </div>
  );
}
