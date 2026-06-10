export type DragTool =
  | { type: "container" }
  | { type: "genericContainer" }
  | { type: "az" }
  | { type: "asg" }
  | { type: "text" }
  | { type: "awsService"; serviceId: string }
  | { type: "user" }
  | { type: "internet" }
  | { type: "web" }
  | { type: "mobile" }
  | { type: "database" }
  | { type: "region" }
  | { type: "aws" };

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

    if (tool.type === "genericContainer") {
      return { type: "genericContainer" };
    }

    if (tool.type === "az") {
      return { type: "az" };
    }

    if (tool.type === "asg") {
      return { type: "asg" };
    }

    if (tool.type === "text") {
      return { type: "text" };
    }

    if (tool.type === "user") {
      return { type: "user" };
    }

    if (tool.type === "internet") {
      return { type: "internet" };
    }

    if (tool.type === "web") {
      return { type: "web" };
    }

    if (tool.type === "mobile") {
      return { type: "mobile" };
    }

    if (tool.type === "database") {
      return { type: "database" };
    }

    if (tool.type === "region") {
      return { type: "region" };
    }

    if (tool.type === "aws") {
      return { type: "aws" };
    }

    if (tool.type === AWS_SERVICE_NODE_TYPE && typeof tool.serviceId === "string") {
      return { type: AWS_SERVICE_NODE_TYPE, serviceId: tool.serviceId };
    }
  } catch {
    return null;
  }

  return null;
}
