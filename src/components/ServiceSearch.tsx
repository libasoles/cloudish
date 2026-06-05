import { useState, useRef, useEffect } from "react";
import { Panel, useReactFlow } from "@xyflow/react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AWS_SERVICES, type AwsService } from "@/data/aws-services";
import { INFRASTRUCTURE_ITEMS } from "@/data/infrastructure-items";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import type { AppNode } from "@/types/flow";
import {
  UI_TEXT,
  getBrowserLocale,
  getCategoryLabel,
  getServiceDescription,
  type Locale,
} from "@/i18n";
import {
  CONTAINER_WIDTH,
  CONTAINER_HEIGHT,
  orderNodesForSubflows,
} from "@/lib/graph-utils";
import { useFlowStore } from "@/store/flowStore";
import { getAwsServiceNodeData } from "@/lib/node-utils";
import { type DragTool } from "@/lib/drag-tools";

const VPC_SERVICE_ID = "vpc";

type ServiceSearchItem = { kind: "service" } & AwsService;
type InfraSearchItem = {
  kind: "infra";
  id: string;
  name: string;
  description: string;
  tool: DragTool;
  Icon: React.ComponentType<{ className?: string }>;
  categoryLabel: string;
  aliases?: string;
};
type SearchItem = ServiceSearchItem | InfraSearchItem;

function buildInfraSearchItems(t: (typeof UI_TEXT)[Locale]): InfraSearchItem[] {
  const categoryLabel = t.searchCategoryInfrastructure;
  return INFRASTRUCTURE_ITEMS.map((item) => ({
    kind: "infra" as const,
    id: item.id,
    name: t[item.tooltipKey as keyof typeof t] as string,
    description: t[item.descriptionKey as keyof typeof t] as string,
    tool: item.tool,
    Icon: item.Icon,
    categoryLabel,
    aliases: item.aliases,
  }));
}

function getSearchResults(
  query: string,
  locale: Locale,
  infraItems: InfraSearchItem[],
): SearchItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const serviceResults: ServiceSearchItem[] = AWS_SERVICES.filter((service) => {
    const categoryLabel = getCategoryLabel(service.category, locale);
    const description = getServiceDescription(service, locale);
    return (
      service.name.toLowerCase().includes(normalizedQuery) ||
      service.category.toLowerCase().includes(normalizedQuery) ||
      categoryLabel.toLowerCase().includes(normalizedQuery) ||
      description.toLowerCase().includes(normalizedQuery) ||
      (service.aliases?.toLowerCase().includes(normalizedQuery) ?? false)
    );
  }).map((s) => ({ kind: "service" as const, ...s }));

  const infraResults: InfraSearchItem[] = infraItems.filter(
    (item) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.categoryLabel.toLowerCase().includes(normalizedQuery) ||
      (item.aliases?.toLowerCase().includes(normalizedQuery) ?? false),
  );

  return [...serviceResults.slice(0, 12), ...infraResults];
}

type ServiceSearchProps = {
  onToolClick?: (tool: DragTool) => void;
};

export default function ServiceSearch({ onToolClick }: ServiceSearchProps) {
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale];
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow<AppNode>();
  const commitGraphChange = useFlowStore((s) => s.commitGraphChange);
  const setInspectorOpen = useFlowStore((s) => s.setInspectorOpen);

  const infraItems = buildInfraSearchItems(t);
  const results = getSearchResults(query, locale, infraItems);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  function addItem(item: SearchItem) {
    if (item.kind === "infra") {
      onToolClick?.(item.tool);
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    const service = item as AwsService;
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    if (service.id === VPC_SERVICE_ID) {
      const vpcNode: AppNode = {
        id: `vpc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "networkContainer",
        selected: true,
        position: {
          x: position.x - CONTAINER_WIDTH / 2,
          y: position.y - CONTAINER_HEIGHT / 2,
        },
        data: { containerType: "vpc", label: "VPC" },
        style: {
          width: CONTAINER_WIDTH,
          height: CONTAINER_HEIGHT,
        },
      };

      commitGraphChange(({ nodes, edges }) => ({
        nodes: [vpcNode, ...nodes.map((n) => ({ ...n, selected: false }))],
        edges,
      }));
    } else {
      const serviceNode: AppNode = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "awsService",
        zIndex: 10,
        selected: true,
        position,
        data: getAwsServiceNodeData(service),
      };

      commitGraphChange(({ nodes, edges }) => ({
        nodes: orderNodesForSubflows([
          ...nodes.map((n) => ({ ...n, selected: false })),
          serviceNode,
        ]),
        edges,
      }));
    }

    setInspectorOpen(true);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleQueryChange(value: string) {
    const nextResults = getSearchResults(value, locale, infraItems);

    setQuery(value);
    setActiveIndex(-1);
    setOpen(nextResults.length > 0);
  }

  function clearSearch() {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) addItem(results[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearSearch();
      inputRef.current?.blur();
    }
  }

  return (
    <Panel position="top-center">
      <div className="relative mt-2" ref={containerRef}>
        <div className="flex w-72 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-card-foreground shadow-md">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-sm text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={t.clearSearch}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            {results.map((item, i) => (
              <li
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm",
                  i === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addItem(item);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {item.kind === "infra" ? (
                  <item.Icon className="size-6 shrink-0 text-muted-foreground" />
                ) : (
                  <AwsServiceIcon
                    slug={item.slug}
                    category={item.category}
                    name={item.name}
                    size={24}
                  />
                )}
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {item.kind === "infra"
                    ? item.categoryLabel
                    : getCategoryLabel(item.category, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
