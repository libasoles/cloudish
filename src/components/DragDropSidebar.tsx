import type { DragEvent, ReactNode } from "react";
import { Container, User, Globe, Layers, Type } from "lucide-react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
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
  DND_MIME_TYPE,
  encodeDragTool,
  type DragTool,
} from "@/lib/drag-tools";

type DragDropSidebarProps = {
  labels: {
    dragAndDrop: string;
    dragOrClickToAdd: string;
    dragSubnet: string;
    dragText: string;
    dragRegion: string;
    dragAz: string;
    subnet: string;
    text: string;
    region: string;
    az: string;
    user: string;
    userDescription: string;
    regionDescription: string;
    azDescription: string;
    subnetDescription: string;
    textDescription: string;
    dragService: (serviceName: string) => string;
    getServiceDescription: (service: AwsService) => string;
  };
  onToolClick?: (tool: DragTool) => void;
  onToolDragStart?: (tool: DragTool) => void;
  onToolDragEnd?: () => void;
};

function setDragPayload(
  event: DragEvent<HTMLButtonElement>,
  tool: DragTool,
  onToolDragStart?: (tool: DragTool) => void,
) {
  event.dataTransfer.setData(DND_MIME_TYPE, encodeDragTool(tool));
  event.dataTransfer.effectAllowed = "move";
  onToolDragStart?.(tool);
}

type SidebarToolButtonProps = {
  name: string;
  description: string;
  ariaLabel: string;
  tool: DragTool;
  featured?: boolean;
  children: ReactNode;
  onToolClick?: (tool: DragTool) => void;
  onToolDragStart?: (tool: DragTool) => void;
  onToolDragEnd?: () => void;
};

function SidebarToolButton({
  name,
  description,
  ariaLabel,
  tool,
  featured = false,
  children,
  onToolClick,
  onToolDragStart,
  onToolDragEnd,
}: SidebarToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          draggable
          onDragStart={(event) =>
            setDragPayload(event, tool, onToolDragStart)
          }
          onDragEnd={onToolDragEnd}
          onClick={() => onToolClick?.(tool)}
          className={
            featured
              ? "flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border border-border bg-card px-1 py-2 text-center text-[11px] font-medium leading-tight text-card-foreground shadow-sm transition hover:border-primary hover:bg-accent"
              : "flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-center text-[11px] font-medium leading-tight text-foreground transition hover:border-border hover:bg-accent"
          }
          aria-label={ariaLabel}
        >
          {children}
          <span className="w-full break-words">{name}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64 px-3 py-2">
        <span className="block text-xs font-semibold leading-tight">
          {name}
        </span>
        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

export default function DragDropSidebar({
  labels,
  onToolClick,
  onToolDragStart,
  onToolDragEnd,
}: DragDropSidebarProps) {
  return (
    <aside className="flex h-full w-24 shrink-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {labels.dragAndDrop}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <SidebarToolButton
          name={labels.user}
          description={`${labels.userDescription} ${labels.dragOrClickToAdd}`}
          ariaLabel={`Drag ${labels.user}`}
          tool={{ type: "user" }}
          onToolClick={onToolClick}
          onToolDragStart={onToolDragStart}
          onToolDragEnd={onToolDragEnd}
        >
          <User className="size-10 text-muted-foreground" />
        </SidebarToolButton>
        <SidebarToolButton
          name={labels.region}
          description={`${labels.regionDescription} ${labels.dragOrClickToAdd}`}
          ariaLabel={labels.dragRegion}
          tool={{ type: "region" }}
          featured
          onToolClick={onToolClick}
          onToolDragStart={onToolDragStart}
          onToolDragEnd={onToolDragEnd}
        >
          <Globe className="h-8 w-8 text-muted-foreground" />
        </SidebarToolButton>
        {vpcService && (
          <SidebarToolButton
            name={vpcService.name}
            description={`${labels.getServiceDescription(vpcService)} ${labels.dragOrClickToAdd}`}
            ariaLabel={labels.dragService(vpcService.name)}
            tool={{
              type: AWS_SERVICE_NODE_TYPE,
              serviceId: vpcService.id,
            }}
            onToolClick={onToolClick}
            onToolDragStart={onToolDragStart}
            onToolDragEnd={onToolDragEnd}
          >
            <AwsServiceIcon
              slug={vpcService.slug}
              category={vpcService.category}
              name={vpcService.name}
              size={40}
            />
          </SidebarToolButton>
        )}
        <SidebarToolButton
          name={labels.az}
          description={`${labels.azDescription} ${labels.dragOrClickToAdd}`}
          ariaLabel={labels.dragAz}
          tool={{ type: "az" }}
          featured
          onToolClick={onToolClick}
          onToolDragStart={onToolDragStart}
          onToolDragEnd={onToolDragEnd}
        >
          <Layers className="h-8 w-8 text-muted-foreground" />
        </SidebarToolButton>
        <SidebarToolButton
          name={labels.subnet}
          description={`${labels.subnetDescription} ${labels.dragOrClickToAdd}`}
          ariaLabel={labels.dragSubnet}
          tool={{ type: "container" }}
          featured
          onToolClick={onToolClick}
          onToolDragStart={onToolDragStart}
          onToolDragEnd={onToolDragEnd}
        >
          <Container className="h-8 w-8 text-muted-foreground" />
        </SidebarToolButton>
        <SidebarToolButton
          name={labels.text}
          description={`${labels.textDescription} ${labels.dragOrClickToAdd}`}
          ariaLabel={labels.dragText}
          tool={{ type: "text" }}
          onToolClick={onToolClick}
          onToolDragStart={onToolDragStart}
          onToolDragEnd={onToolDragEnd}
        >
          <Type className="h-8 w-8 text-muted-foreground" />
        </SidebarToolButton>
        {dragServices.map((service) => (
          <SidebarToolButton
            key={service.id}
            name={service.name}
            description={`${labels.getServiceDescription(service)} ${labels.dragOrClickToAdd}`}
            ariaLabel={labels.dragService(service.name)}
            tool={{
              type: AWS_SERVICE_NODE_TYPE,
              serviceId: service.id,
            }}
            onToolClick={onToolClick}
            onToolDragStart={onToolDragStart}
            onToolDragEnd={onToolDragEnd}
          >
            <AwsServiceIcon
              slug={service.slug}
              category={service.category}
              name={service.name}
              size={40}
            />
          </SidebarToolButton>
        ))}
      </div>
    </aside>
  );
}
