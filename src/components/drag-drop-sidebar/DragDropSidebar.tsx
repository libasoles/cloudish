import { type DragEvent, type ReactNode, useState } from "react";
import { Type, ChevronDown } from "lucide-react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import { HoverOnlyTooltip } from "@/components/HoverOnlyTooltip";
import { draggableAwsServices } from "@/data/drag-tool-catalog";
import {
  CLIENTS,
  CONTAINERS,
  CUSTOM,
  type InfrastructureItem,
} from "@/data/infrastructure-items";
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
  dragOrClickText: string;
  ariaLabel: string;
  tool: DragTool;
  variant?: "container" | "default";
  children: ReactNode;
  onToolClick?: (tool: DragTool) => void;
  onToolDragStart?: (tool: DragTool) => void;
  onToolDragEnd?: () => void;
};

const SIDEBAR_TOOL_BUTTON_CLASSES = {
  container:
    "flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border border-border bg-card px-1 py-2 text-center text-[11px] font-medium leading-tight text-card-foreground shadow-sm transition hover:border-primary hover:bg-accent",
  default:
    "flex w-full cursor-pointer flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-center text-[11px] font-medium leading-tight text-foreground transition hover:border-border hover:bg-accent",
} as const;

function SidebarToolButton({
  name,
  description,
  dragOrClickText,
  ariaLabel,
  tool,
  variant = "default",
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
          <span className="mt-2 block text-xs leading-snug text-muted-foreground/60">
            {dragOrClickText}
          </span>
        </>
      }
    >
      <button
        type="button"
        draggable
        onDragStart={(event) => setDragPayload(event, tool, onToolDragStart)}
        onDragEnd={onToolDragEnd}
        onClick={() => onToolClick?.(tool)}
        className={SIDEBAR_TOOL_BUTTON_CLASSES[variant]}
        aria-label={ariaLabel}
      >
        {children}
        <span className="w-full break-words">{name}</span>
      </button>
    </HoverOnlyTooltip>
  );
}

function renderInfrastructureTool(
  item: InfrastructureItem,
  {
    labels,
    infraLabels,
    variant = "default",
    iconClassName,
    onToolClick,
    onToolDragStart,
    onToolDragEnd,
  }: {
    labels: DragDropSidebarProps["labels"];
    infraLabels: DragDropSidebarProps["infraLabels"];
    variant?: "container" | "default";
    iconClassName: string;
    onToolClick?: (tool: DragTool) => void;
    onToolDragStart?: (tool: DragTool) => void;
    onToolDragEnd?: () => void;
  },
) {
  const infraLabel = infraLabels[item.id];

  return (
    <SidebarToolButton
      key={item.id}
      name={infraLabel.name}
      description={infraLabel.description}
      dragOrClickText={labels.dragOrClickToAdd}
      ariaLabel={`Drag ${infraLabel.name}`}
      tool={item.tool}
      variant={variant}
      onToolClick={onToolClick}
      onToolDragStart={onToolDragStart}
      onToolDragEnd={onToolDragEnd}
    >
      <item.Icon className={iconClassName} />
    </SidebarToolButton>
  );
}

export default function DragDropSidebar({
  labels,
  infraLabels,
  onToolClick,
  onToolDragStart,
  onToolDragEnd,
}: DragDropSidebarProps) {
  const [showAllServices, setShowAllServices] = useState(false);
  const visibleServices = showAllServices
    ? draggableAwsServices
    : draggableAwsServices.slice(0, 5);
  const hasMoreServices = draggableAwsServices.length > 5;

  return (
    <aside className="flex h-full w-24 shrink-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {labels.dragAndDrop}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {CUSTOM.filter((item) => !item.searchOnly).map((item) =>
          renderInfrastructureTool(item, {
            labels,
            infraLabels,
            iconClassName: "size-10 text-muted-foreground",
            onToolClick,
            onToolDragStart,
            onToolDragEnd,
          }),
        )}
        {CONTAINERS.filter((item) => !item.searchOnly).map((item) =>
          renderInfrastructureTool(item, {
            labels,
            infraLabels,
            variant: "container",
            iconClassName: "h-8 w-8 text-muted-foreground",
            onToolClick,
            onToolDragStart,
            onToolDragEnd,
          }),
        )}

        <SidebarToolButton
          name={labels.text}
          description={labels.textDescription}
          dragOrClickText={labels.dragOrClickToAdd}
          ariaLabel={labels.dragText}
          tool={{ type: "text" }}
          onToolClick={onToolClick}
          onToolDragStart={onToolDragStart}
          onToolDragEnd={onToolDragEnd}
        >
          <Type className="h-8 w-8 text-muted-foreground" />
        </SidebarToolButton>
        {visibleServices.map((service) => (
          <SidebarToolButton
            key={service.id}
            name={service.name}
            description={labels.getServiceDescription(service)}
            dragOrClickText={labels.dragOrClickToAdd}
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
        {hasMoreServices && (
          <button
            onClick={() => setShowAllServices(!showAllServices)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {showAllServices ? "Ver menos" : "Ver más"}
            <ChevronDown
              className="h-4 w-4 transition-transform"
              style={{
                transform: showAllServices ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        )}
        {CLIENTS.filter((item) => !item.searchOnly).map((item) =>
          renderInfrastructureTool(item, {
            labels,
            infraLabels,
            iconClassName: "size-10 text-muted-foreground",
            onToolClick,
            onToolDragStart,
            onToolDragEnd,
          }),
        )}
      </div>
    </aside>
  );
}
