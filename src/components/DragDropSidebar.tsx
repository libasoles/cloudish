import type { DragEvent, ReactNode } from "react";
import { Type } from "lucide-react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import { VpcIcon } from "@/components/icons/VpcIcon";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import {
  dragServices,
  vpcService,
} from "@/data/drag-tool-catalog";
import { INFRASTRUCTURE_ITEMS } from "@/data/infrastructure-items";
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
    dragText: string;
    text: string;
    textDescription: string;
    dragService: (serviceName: string) => string;
    getServiceDescription: (service: AwsService) => string;
  };
  infraLabels: Record<
    string,
    {
      name: string;
      description: string;
      tooltipKey?: string;
    }
  >;
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
    <HoverOnlyTooltip
      side="right"
      contentClassName="max-w-64 px-3 py-2"
      triggerClassName="w-full"
      content={
        <>
          <span className="block text-xs font-semibold leading-tight">
            {name}
          </span>
          <span className="mt-1 block text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        </>
      }
    >
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
    </HoverOnlyTooltip>
  );
}

export default function DragDropSidebar({
  labels,
  infraLabels,
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
        {INFRASTRUCTURE_ITEMS.map((item) => {
          const infraLabel = infraLabels[item.id];
          const isFeatured = item.tool.type !== "user" && item.tool.type !== "internet" && item.tool.type !== "text";
          return (
            <SidebarToolButton
              key={item.id}
              name={infraLabel.name}
              description={`${infraLabel.description} ${labels.dragOrClickToAdd}`}
              ariaLabel={`Drag ${infraLabel.name}`}
              tool={item.tool}
              featured={isFeatured}
              onToolClick={onToolClick}
              onToolDragStart={onToolDragStart}
              onToolDragEnd={onToolDragEnd}
            >
              <item.Icon className={isFeatured ? "h-8 w-8 text-muted-foreground" : "size-10 text-muted-foreground"} />
            </SidebarToolButton>
          );
        })}
        {vpcService && (
          <SidebarToolButton
            name={vpcService.name}
            description={`${labels.getServiceDescription(vpcService)} ${labels.dragOrClickToAdd}`}
            ariaLabel={labels.dragService(vpcService.name)}
            tool={{
              type: AWS_SERVICE_NODE_TYPE,
              serviceId: vpcService.id,
            }}
            featured
            onToolClick={onToolClick}
            onToolDragStart={onToolDragStart}
            onToolDragEnd={onToolDragEnd}
          >
            <VpcIcon className="h-8 w-8 text-muted-foreground" />
          </SidebarToolButton>
        )}
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
