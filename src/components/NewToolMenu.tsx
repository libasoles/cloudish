import { useState } from "react";
import { Container, Globe, Plus, User } from "lucide-react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  dragServices,
  vpcService,
} from "@/data/drag-tool-catalog";
import type { AwsService } from "@/data/aws-services";
import {
  AWS_SERVICE_NODE_TYPE,
  type DragTool,
} from "@/lib/drag-tools";
import { cn } from "@/lib/utils";

type NewToolMenuProps = {
  labels: {
    newTool: string;
    newToolTooltip: string;
    newToolMenuTitle: string;
    addTool: (toolName: string) => string;
    clickToAdd: string;
    subnet: string;
    region: string;
    user: string;
    userDescription: string;
    regionDescription: string;
    subnetDescription: string;
    getServiceDescription: (service: AwsService) => string;
  };
  onToolClick: (tool: DragTool) => void;
};

type ToolMenuItem = {
  id: string;
  name: string;
  description: string;
  tool: DragTool;
  service?: AwsService;
  icon: "user" | "region" | "subnet" | "service";
};

function getServiceTool(service: AwsService): DragTool {
  return {
    type: AWS_SERVICE_NODE_TYPE,
    serviceId: service.id,
  };
}

function getToolItems(labels: NewToolMenuProps["labels"]): ToolMenuItem[] {
  return [
    {
      id: "user",
      name: labels.user,
      description: labels.userDescription,
      tool: { type: "user" },
      icon: "user",
    },
    {
      id: "region",
      name: labels.region,
      description: labels.regionDescription,
      tool: { type: "region" },
      icon: "region",
    },
    ...(vpcService
      ? [
          {
            id: vpcService.id,
            name: vpcService.name,
            description: labels.getServiceDescription(vpcService),
            tool: getServiceTool(vpcService),
            service: vpcService,
            icon: "service" as const,
          },
        ]
      : []),
    {
      id: "subnet",
      name: labels.subnet,
      description: labels.subnetDescription,
      tool: { type: "container" },
      icon: "subnet",
    },
    ...dragServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: labels.getServiceDescription(service),
      tool: getServiceTool(service),
      service,
      icon: "service" as const,
    })),
  ];
}

function ToolIcon({ item, className }: { item: ToolMenuItem; className?: string }) {
  if (item.service) {
    return (
      <AwsServiceIcon
        slug={item.service.slug}
        category={item.service.category}
        name={item.service.name}
        size={24}
      />
    );
  }

  const iconClassName = cn("size-5 text-muted-foreground", className);

  if (item.icon === "user") return <User className={iconClassName} />;
  if (item.icon === "region") return <Globe className={iconClassName} />;
  return <Container className={iconClassName} />;
}

export default function NewToolMenu({ labels, onToolClick }: NewToolMenuProps) {
  const [open, setOpen] = useState(false);
  const items = getToolItems(labels);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="gap-2 px-3"
              aria-label={labels.newTool}
            >
              <Plus className="size-5" />
              <span>{labels.newTool}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">{labels.newToolTooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" side="left" className="w-80 p-2">
        <div className="px-2 pb-2 pt-1 text-sm font-semibold text-popover-foreground">
          {labels.newToolMenuTitle}
          <span className="mt-1 block text-xs font-normal leading-snug text-muted-foreground">
            {labels.clickToAdd}
          </span>
        </div>
        <div className="max-h-[min(520px,calc(100vh-7rem))] space-y-1 overflow-y-auto pr-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onToolClick(item.tool);
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={labels.addTool(item.name)}
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                <ToolIcon item={item} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight text-popover-foreground">
                  {item.name}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
