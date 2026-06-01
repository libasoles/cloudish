import type { DragEvent } from "react";
import { Container } from "lucide-react";
import { AwsServiceIcon } from "@/components/AwsServiceIcon";
import { AWS_SERVICES, type AwsService } from "@/data/aws-services";
import {
  AWS_SERVICE_NODE_TYPE,
  DND_MIME_TYPE,
  encodeDragTool,
  type DragTool,
} from "@/lib/drag-tools";

const TOP_AWS_SERVICE_IDS = [
  "s3",
  "ec2",
  "lambda",
  "fargate",
  "rds",
  "dynamodb",
  "cloudfront",
  "api-gateway",
  "iam",
  "cloudwatch",
  "sqs",
] as const;

const VPC_SERVICE_ID = "vpc";
const vpcService = AWS_SERVICES.find((service) => service.id === VPC_SERVICE_ID);
const dragServices = TOP_AWS_SERVICE_IDS.map((serviceId) =>
  AWS_SERVICES.find((service) => service.id === serviceId),
).filter((service): service is AwsService => Boolean(service));

type DragDropSidebarProps = {
  labels: {
    dragAndDrop: string;
    dragSubnet: string;
    subnet: string;
    dragService: (serviceName: string) => string;
  };
};

function setDragPayload(event: DragEvent<HTMLButtonElement>, tool: DragTool) {
  event.dataTransfer.setData(DND_MIME_TYPE, encodeDragTool(tool));
  event.dataTransfer.effectAllowed = "move";
}

export default function DragDropSidebar({ labels }: DragDropSidebarProps) {
  return (
    <aside className="flex h-full w-24 shrink-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {labels.dragAndDrop}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {vpcService && (
          <button
            type="button"
            draggable
            onDragStart={(event) =>
              setDragPayload(event, {
                type: AWS_SERVICE_NODE_TYPE,
                serviceId: vpcService.id,
              })
            }
            className="flex w-full flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-center text-[11px] font-medium leading-tight text-foreground transition hover:border-border hover:bg-accent"
            aria-label={labels.dragService(vpcService.name)}
            title={vpcService.name}
          >
            <AwsServiceIcon
              slug={vpcService.slug}
              category={vpcService.category}
              name={vpcService.name}
              size={40}
            />
            <span className="w-full break-words">{vpcService.name}</span>
          </button>
        )}
        <button
          type="button"
          draggable
          onDragStart={(event) => setDragPayload(event, { type: "container" })}
          className="flex w-full flex-col items-center gap-1 rounded-md border border-border bg-card px-1 py-2 text-center text-[11px] font-medium leading-tight text-card-foreground shadow-sm transition hover:border-primary hover:bg-accent"
          aria-label={labels.dragSubnet}
          title={labels.subnet}
        >
          <Container className="h-8 w-8 text-muted-foreground" />
          <span className="w-full break-words">{labels.subnet}</span>
        </button>
        {dragServices.map((service) => (
          <button
            key={service.id}
            type="button"
            draggable
            onDragStart={(event) =>
              setDragPayload(event, {
                type: AWS_SERVICE_NODE_TYPE,
                serviceId: service.id,
              })
            }
            className="flex w-full flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-center text-[11px] font-medium leading-tight text-foreground transition hover:border-border hover:bg-accent"
            aria-label={labels.dragService(service.name)}
            title={service.name}
          >
            <AwsServiceIcon
              slug={service.slug}
              category={service.category}
              name={service.name}
              size={40}
            />
            <span className="w-full break-words">{service.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
