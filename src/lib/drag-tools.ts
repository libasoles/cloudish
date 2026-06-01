export type DragTool =
  | { type: "container" }
  | { type: "awsService"; serviceId: string }
  | { type: "user" }
  | { type: "region" };

export const CONTAINER_NODE_TYPE = "container";
export const AWS_SERVICE_NODE_TYPE = "awsService";
export const DND_MIME_TYPE = "application/reactflow";

export function encodeDragTool(tool: DragTool) {
  return JSON.stringify(tool);
}

export function decodeDragTool(value: string): DragTool | null {
  if (value === CONTAINER_NODE_TYPE) {
    return { type: "container" };
  }

  try {
    const tool = JSON.parse(value) as Partial<DragTool>;

    if (tool.type === "container") {
      return { type: "container" };
    }

    if (tool.type === "user") {
      return { type: "user" };
    }

    if (tool.type === "region") {
      return { type: "region" };
    }

    if (tool.type === AWS_SERVICE_NODE_TYPE && typeof tool.serviceId === "string") {
      return { type: AWS_SERVICE_NODE_TYPE, serviceId: tool.serviceId };
    }
  } catch {
    return null;
  }

  return null;
}
