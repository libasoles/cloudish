import { useState, useRef, useEffect } from "react";
import { Panel } from "@xyflow/react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AWS_SERVICES, type AwsService } from "@/data/aws-services";
import { INFRASTRUCTURE_ITEMS } from "@/data/infrastructure-items";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import {
  UI_TEXT,
  getBrowserLocale,
  getCategoryLabel,
  getServiceDescription,
  type Locale,
} from "@/i18n";
import { AWS_SERVICE_NODE_TYPE, type DragTool } from "@/lib/drag-tools";
import {
  isMiscellaneousServiceId,
  MISCELLANEOUS_SERVICE_IDS,
} from "@/lib/node-utils";
import { SERVICE_RELATIONS } from "@/data/aws-service-relations";
import { useFlowStore } from "@/store/flowStore";
import type { AppNode } from "@/types/flow";

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
    // VPC and miscellaneous nodes (User, Internet, Web, Mobile, Database)
    // are offered as infrastructure items below — skip the catalog duplicates.
    if (service.id === VPC_SERVICE_ID || isMiscellaneousServiceId(service.id)) {
      return false;
    }

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

function getContextItems(
  nodes: AppNode[],
  infraItems: InfraSearchItem[],
): SearchItem[] {
  const selectedServiceIds = nodes
    .filter((n) => n.selected)
    .flatMap((n) => {
      // Miscellaneous nodes (user, internet, web, mobile, database) use their node
      // type as the service ID — they have no serviceId in their data.
      if (MISCELLANEOUS_SERVICE_IDS.has(n.type ?? "")) return [n.type as string];
      const serviceId = (n.data as { serviceId?: string }).serviceId;
      return serviceId ? [serviceId] : [];
    });

  if (selectedServiceIds.length === 0) return [];

  const relatedIds = [
    ...new Set(selectedServiceIds.flatMap((id) => SERVICE_RELATIONS[id] ?? [])),
  ];

  return relatedIds.flatMap((id): SearchItem[] => {
    const infraItem = infraItems.find((item) => {
      if (item.tool.type === AWS_SERVICE_NODE_TYPE) {
        return (item.tool as { type: string; serviceId: string }).serviceId === id;
      }
      return item.tool.type === id;
    });
    if (infraItem) return [infraItem];

    const service = AWS_SERVICES.find((s) => s.id === id);
    if (service) return [{ kind: "service" as const, ...service }];

    return [];
  });
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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useFlowStore((s) => s.nodes);
  const infraItems = buildInfraSearchItems(t);
  const results = getSearchResults(query, locale, infraItems);
  const contextItems = getContextItems(nodes, infraItems);

  const contextMode = isFocused && query.length === 0 && contextItems.length > 0;
  const displayItems = query.length > 0 ? results : contextItems;
  const showDropdown = (open && query.length > 0 && results.length > 0) || contextMode;

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
    } else {
      onToolClick?.({ type: AWS_SERVICE_NODE_TYPE, serviceId: item.id });
    }

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
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, displayItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) addItem(displayItems[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearSearch();
      inputRef.current?.blur();
    }
  }

  return (
    <Panel position="top-center">
      <div className="relative mt-2" ref={containerRef}>
        <div className="flex w-72 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-card-foreground shadow-md transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (results.length > 0) setOpen(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              window.setTimeout(() => setOpen(false), 0);
            }}
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

        {showDropdown && displayItems.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <ul className="max-h-64 overflow-y-auto">
              {displayItems.map((item, i) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm",
                    i === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                  onPointerDown={(e) => {
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
                      size="small"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {item.kind === "infra"
                      ? item.categoryLabel
                      : getCategoryLabel(item.category, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}
