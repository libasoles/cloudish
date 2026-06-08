import type { Edge, Node, Viewport } from "@xyflow/react";
import type { AwsServiceNodeType } from "@/components/nodes/AwsServiceNode";
import type { CircularServiceNodeType } from "@/components/nodes/CircularServiceNode";
import type { NetworkContainerNodeType } from "@/components/nodes/NetworkContainerNode";
import type { PlainTextNodeType } from "@/components/nodes/PlainTextNode";
import type { ExternalNodeType } from "@/components/nodes/ExternalNode";

export type AppNode =
  | Node
  | AwsServiceNodeType
  | CircularServiceNodeType
  | NetworkContainerNodeType
  | PlainTextNodeType
  | ExternalNodeType;
export type AppEdge = Edge;

export type SubnetType = "Public" | "Private";

export type NetworkContainerType = "subnet" | "vpc" | "region" | "az" | "asg" | "generic";

export type ContainerDropPreview = {
  parentId: string;
  childType: NetworkContainerType;
};

export type NetworkContainerNodeData = {
  containerType: NetworkContainerType;
  label: string;
  subnetType?: SubnetType;
  fields?: Record<string, string | boolean | number>;
  pulseKey?: string;
  synced?: boolean;
};

export type SubnetNodeData = NetworkContainerNodeData & {
  containerType: "subnet";
  subnetType: SubnetType;
};

export type FlowPosition = {
  x: number;
  y: number;
};

export type FlowViewport = Viewport;

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "ANY";

export type ApiGatewayRoute = {
  id: string;
  method: HttpMethod;
  path: string;
};

export type AzSyncRole = "source" | "mirror";

export type AzSyncNodeData = {
  syncGroupId?: string;
  syncSourceAzId?: string;
  syncRole?: AzSyncRole;
};

export type AzSyncEdgeData = AzSyncNodeData;
