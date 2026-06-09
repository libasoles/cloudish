import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import { SERVICE_RELATIONS } from "@/data/aws-service-relations";
import { ALL_SERVICES } from "@/lib/node-utils";
import { UI_TEXT, getBrowserLocale } from "@/i18n";
import { getServiceId } from "@/lib/node-utils";
import { useFlowStore } from "@/store/flowStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AwsServiceNodeType } from "@/components/nodes/AwsServiceNode";

type RelatedServicesPanelProps = {
  node: AwsServiceNodeType;
};

const PAGE_SIZE = 7;

export function RelatedServicesPanel({ node }: RelatedServicesPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const addRelatedNode = useFlowStore((s) => s.addRelatedNode);
  const locale = getBrowserLocale();
  const t = UI_TEXT[locale] as (typeof UI_TEXT)["en"];

  const serviceId = getServiceId(node);
  const relatedIds = SERVICE_RELATIONS[serviceId] ?? [];
  const related = relatedIds
    .map((id) => ALL_SERVICES.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (related.length === 0) return null;

  const visible = showAll ? related : related.slice(0, PAGE_SIZE);
  const hasMore = !showAll && related.length > PAGE_SIZE;

  return (
    <div className="border-t border-border pt-4 pb-2">
      <p className="pb-4 text-xs font-medium text-muted-foreground">
        {t.relatedServices}
      </p>
      <TooltipProvider>
      <ul className="space-y-0.5">
        {visible.map((service) => (
          <li
            key={service.id}
            className="flex items-center gap-1 rounded-md py-0.5 hover:bg-muted/20"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => addRelatedNode(node.id, service.id, "left")}
                  className="flex-none rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground -ml-1.5"
                >
                  <ArrowLeft className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{t.addToLeft}</TooltipContent>
            </Tooltip>
            <AwsServiceIcon
              slug={service.slug}
              category={service.category}
              name={service.name}
              size={24}
            />
            <span className="flex-1 truncate text-xs text-foreground">
              {service.name}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => addRelatedNode(node.id, service.id, "top")}
                  className="flex-none rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{t.addToTop}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => addRelatedNode(node.id, service.id, "bottom")}
                  className="flex-none rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{t.addToBottom}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => addRelatedNode(node.id, service.id, "right")}
                  className="flex-none rounded p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground -mr-1.5"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{t.addToRight}</TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>
      </TooltipProvider>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t.loadMore}
        </button>
      )}
    </div>
  );
}
